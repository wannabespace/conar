import { faker } from '@faker-js/faker/locale/en'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { sql } from 'kysely'
import { memoize } from 'memoza'

import { capabilitiesOf } from '~/core/catalog/capabilities'
import type { Column } from '~/core/table/cell/utils'

import { BASE_GENERATORS, columnMaxLength, columnTypeName } from './base'
import { clickhouseSeedConfig } from './clickhouse.ts'
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

export interface GeneratorGroup {
  value: string
  items: GeneratorId[]
}

export type Generators = Partial<Record<GeneratorId, GeneratorDef>>

export const getGenerators = memoize((dialect: ConnectionType): Generators => ({
  ...BASE_GENERATORS,
  ...DIALECT_CONFIGS[dialect].generators,
}))

export const getGeneratorGroups = memoize(
  (dialect: ConnectionType): GeneratorGroup[] =>
    Object.entries(
      Object.groupBy(
        Object.entries(getGenerators(dialect)),
        ([, def]) => def.category
      )
    ).map(([value, entries]) => ({
      items: (entries ?? []).map(([id]) => id as GeneratorId),
      value,
    }))
)

// ClickHouse gives every column a zero-value default.
const canSkipColumn = (column: Column, dialect: ConnectionType) =>
  dialect === ConnectionType.ClickHouse ||
  !!column.isNullable ||
  !!column.defaultValue ||
  !!column.isGenerated

const AVAILABILITY: Partial<
  Record<GeneratorId, (column: Column, dialect: ConnectionType) => boolean>
> = {
  [ENUM_GENERATOR]: (column) => !!column.availableValues?.length,
  [NULL_GENERATOR]: (column) => !!column.isNullable,
  [REFERENCE_GENERATOR]: (column) => !!column.foreign,
  [SKIP_GENERATOR]: canSkipColumn,
}

export const isGeneratorAvailable = (
  id: GeneratorId,
  column: Column,
  dialect: ConnectionType
) => AVAILABILITY[id]?.(column, dialect) ?? true

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

const NULL_SHARE = 0.25
const ARRAY_LENGTH = { max: 5, min: 1 }
const produceNull = (): unknown => null

const multipleIfArray = (column: Column, one: () => unknown) =>
  column.isArray
    ? () => faker.helpers.multiple(one, { count: ARRAY_LENGTH })
    : one

const valueProducer = ({
  column,
  generator: { customExpression, generatorId },
  generators,
  referenceValues,
}: {
  column: Column
  generator: Generator
  generators: Generators
  referenceValues?: unknown[]
}): (() => unknown) | undefined => {
  const def = generators[generatorId]

  if (!def || generatorId === SKIP_GENERATOR) {
    return undefined
  }

  if (generatorId === NULL_GENERATOR) {
    return produceNull
  }

  if (generatorId === CUSTOM_GENERATOR) {
    const expression = customExpression?.trim()
    const raw = expression && sql.raw(`(${expression})`)
    return raw ? () => raw : undefined
  }

  if (generatorId === REFERENCE_GENERATOR) {
    if (referenceValues?.length) {
      return multipleIfArray(column, () =>
        faker.helpers.arrayElement(referenceValues)
      )
    }
    if (column.isNullable) {
      return produceNull
    }
    throw new Error(
      `"${column.foreign?.schema}.${column.foreign?.table}" has no rows to reference for "${column.id}".`
    )
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

  return multipleIfArray(column, () => def.generate(column))
}

const DISTINCT_ATTEMPTS = 100

const distinctProducer = (produce: () => unknown, column: Column) => {
  const seen = new Set<unknown>()

  return () => {
    for (let attempt = 0; attempt < DISTINCT_ATTEMPTS; attempt += 1) {
      const value = produce()
      if (!seen.has(value)) {
        seen.add(value)
        return value
      }
    }
    throw new Error(
      `"${column.id}" must be unique, but its generator ran out of distinct values.`
    )
  }
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  Object.getPrototypeOf(value) === Object.prototype

// A JSON column's value stays parsed: the insert's `bindValue` stringifies it, and a string here is stored as a JSON string.
// Any other column gets the text, since no driver binds a plain object as JSON.
const finalizeValue = (
  value: unknown,
  column: Column,
  dialect: ConnectionType
) => {
  if (capabilitiesOf(dialect).columnTypes.json.test(column.type ?? '')) {
    return value
  }
  if (Array.isArray(value)) {
    return column.isArray
      ? (DIALECT_CONFIGS[dialect].transformArray?.(value, column) ?? value)
      : JSON.stringify(value)
  }
  if (isPlainObject(value)) {
    return JSON.stringify(value)
  }
  const maxLength = columnMaxLength(column)
  return typeof value === 'string' && maxLength
    ? value.slice(0, maxLength)
    : value
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
  const generators = getGenerators(dialect)

  const columnProducers = columns.flatMap((column) => {
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

    const next =
      (column.unique || column.primaryKey) &&
      generator.generatorId !== CUSTOM_GENERATOR
        ? distinctProducer(produce, column)
        : produce
    const nullable = generator.isNullable && column.isNullable

    return [
      [
        column.id,
        () =>
          finalizeValue(
            nullable && faker.datatype.boolean(NULL_SHARE) ? null : next(),
            column,
            dialect
          ),
      ] as const,
    ]
  })

  return Array.from({ length: count }, () =>
    Object.fromEntries(columnProducers.map(([id, next]) => [id, next()]))
  )
}
