import { faker } from '@faker-js/faker'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { sql } from 'kysely'
import { memoize } from 'memoza'

import type { Column } from '../../components/table/cell/utils'
import { BASE_GENERATORS, columnTypeName } from './base'
import { clickhouseSeedConfig } from './clickhouse'
import { detectGenerator } from './detect'
import { mssqlSeedConfig } from './mssql'
import { mysqlSeedConfig } from './mysql'
import { pgSeedConfig } from './postgres'
import type { DialectSeedConfig, Generator, GeneratorId } from './registry'
import type { GeneratorDef } from './types'
import {
  CUSTOM_GENERATOR,
  ENUM_GENERATOR,
  NULL_GENERATOR,
  REFERENCE_GENERATOR,
  SKIP_GENERATOR,
} from './types'

const DIALECT_CONFIGS: Record<ConnectionType, DialectSeedConfig> = {
  clickhouse: clickhouseSeedConfig,
  mssql: mssqlSeedConfig,
  mysql: mysqlSeedConfig,
  postgres: pgSeedConfig,
}

const CATEGORY_ORDER = [
  'Special',
  'Person',
  'Internet',
  'Text',
  'Number',
  'Date',
  'Boolean',
  'ID',
  'Location',
  'Commerce',
  'Finance',
  'System',
  'Other',
]

export interface GeneratorGroup {
  value: string
  items: GeneratorId[]
}

export type Generators = Partial<Record<GeneratorId, GeneratorDef>>

export const getGenerators = memoize((dialect: ConnectionType): Generators => ({
  ...BASE_GENERATORS,
  ...DIALECT_CONFIGS[dialect].generators,
}))

const categoryRank = (category: string) => {
  const index = CATEGORY_ORDER.indexOf(category)
  return index === -1 ? CATEGORY_ORDER.length : index
}

export const getGeneratorGroups = memoize(
  (dialect: ConnectionType): GeneratorGroup[] =>
    Object.entries(
      Object.groupBy(
        Object.entries(getGenerators(dialect)),
        ([, def]) => def.category
      )
    )
      .map(([value, entries]) => ({
        items: (entries ?? []).map(([id]) => id as GeneratorId),
        value,
      }))
      .toSorted((a, b) => categoryRank(a.value) - categoryRank(b.value))
)

// A column left out of the insert must have something the database can fill in.
// ClickHouse gives every column a zero-value default.
export const canSkipColumn = (column: Column, dialect: ConnectionType) =>
  dialect === ConnectionType.ClickHouse ||
  !!column.isNullable ||
  !!column.defaultValue ||
  !!column.isGenerated

export const isGeneratorAvailable = (
  id: GeneratorId,
  column: Column,
  dialect: ConnectionType
) => {
  switch (id) {
    case SKIP_GENERATOR: {
      return canSkipColumn(column, dialect)
    }
    case NULL_GENERATOR: {
      return !!column.isNullable
    }
    case REFERENCE_GENERATOR: {
      return !!column.foreign
    }
    case ENUM_GENERATOR: {
      return !!column.availableValues?.length
    }
    default: {
      return true
    }
  }
}

export const autoDetectGenerator = (
  column: Column,
  dialect: ConnectionType
): GeneratorId => {
  if (column.foreign) {
    return REFERENCE_GENERATOR
  }
  if (column.availableValues?.length) {
    return ENUM_GENERATOR
  }
  if (column.isGenerated || column.defaultValue) {
    return SKIP_GENERATOR
  }

  const type = columnTypeName(column)
  return DIALECT_CONFIGS[dialect].types[type] ?? detectGenerator(column, type)
}

// MSSQL caps a statement at 2100 bound parameters; the others comfortably take 500 rows per statement
const PARAMETER_LIMITS: Partial<Record<ConnectionType, number>> = {
  [ConnectionType.MSSQL]: 2000,
}
const MAX_ROWS_PER_INSERT = 500

export const insertBatchSize = (
  dialect: ConnectionType,
  columnCount: number
) => {
  const limit = PARAMETER_LIMITS[dialect]
  return limit
    ? Math.max(
        1,
        Math.min(MAX_ROWS_PER_INSERT, Math.floor(limit / columnCount))
      )
    : MAX_ROWS_PER_INSERT
}

// A quarter of the rows exercises null handling without drowning the data
const NULL_SHARE = 0.25
const ARRAY_LENGTH = { max: 5, min: 1 }
const nullValue: unknown = null
const produceNull = () => nullValue

const valueProducer = ({
  column,
  generator,
  generators,
  referenceValues,
}: {
  column: Column
  generator: Generator
  generators: Generators
  referenceValues?: unknown[]
}): (() => unknown) | undefined => {
  const { generatorId, customExpression } = generator
  const def = generators[generatorId]

  if (!def || generatorId === SKIP_GENERATOR) {
    return undefined
  }

  if (generatorId === NULL_GENERATOR) {
    return produceNull
  }

  if (generatorId === CUSTOM_GENERATOR) {
    const expression = customExpression?.trim()
    if (!expression) {
      return undefined
    }
    const raw = sql.raw(`(${expression})`)
    return () => raw
  }

  if (generatorId === REFERENCE_GENERATOR) {
    if (!referenceValues?.length) {
      if (column.isNullable) {
        return produceNull
      }
      throw new Error(
        `"${column.foreign?.schema}.${column.foreign?.table}" has no rows to reference for "${column.id}".`
      )
    }
    return column.isArray
      ? () =>
          faker.helpers.multiple(
            () => faker.helpers.arrayElement(referenceValues),
            { count: ARRAY_LENGTH }
          )
      : () => faker.helpers.arrayElement(referenceValues)
  }

  if (generatorId === ENUM_GENERATOR) {
    const values = column.availableValues ?? []
    return column.isArray
      ? () =>
          faker.helpers.arrayElements(values, {
            max: Math.min(ARRAY_LENGTH.max, values.length),
            min: 1,
          })
      : () => faker.helpers.arrayElement(values)
  }

  return column.isArray
    ? () =>
        faker.helpers.multiple(() => def.generate(column), {
          count: ARRAY_LENGTH,
        })
    : () => def.generate(column)
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  Object.getPrototypeOf(value) === Object.prototype

// Every driver but pg binds a plain object as something other than JSON, and pg casts the string back
const finalizeValue = (
  value: unknown,
  column: Column,
  config: DialectSeedConfig
) => {
  if (Array.isArray(value)) {
    return column.isArray
      ? (config.transformArray?.(value, column) ?? value)
      : JSON.stringify(value)
  }
  if (isPlainObject(value)) {
    return JSON.stringify(value)
  }
  if (
    typeof value === 'string' &&
    column.maxLength &&
    value.length > column.maxLength
  ) {
    return value.slice(0, column.maxLength)
  }
  return value
}

export const generateRows = ({
  columns,
  columnGenerators,
  count,
  dialect,
  referenceData,
}: {
  columns: Column[]
  columnGenerators: Record<string, Generator>
  count: number
  dialect: ConnectionType
  referenceData?: Record<string, unknown[]>
}) => {
  const config = DIALECT_CONFIGS[dialect]
  const generators = getGenerators(dialect)

  const columnValues = columns.flatMap((column) => {
    const generator = columnGenerators[column.id]
    const produce =
      generator &&
      valueProducer({
        column,
        generator,
        generators,
        referenceValues: referenceData?.[column.id],
      })
    if (!produce) {
      return []
    }

    const unique =
      column.unique || column.primaryKey
        ? faker.helpers.uniqueArray(produce, count)
        : []
    const values = Array.from({ length: count }, (_, index) => {
      if (generator.isNullable && column.isNullable) {
        return faker.datatype.boolean(NULL_SHARE) ? null : produce()
      }
      return unique[index] ?? produce()
    })

    return [
      [column.id, values.map((v) => finalizeValue(v, column, config))] as const,
    ]
  })

  return Array.from({ length: count }, (_, index) =>
    Object.fromEntries(columnValues.map(([id, values]) => [id, values[index]]))
  )
}
