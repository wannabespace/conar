import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { Column } from '../../components/table/cell'
import { faker } from '@faker-js/faker'
import { sql } from 'kysely'
import { BASE_GENERATORS, baseAutoDetectGenerator } from './base'
import { mssqlSeedConfig } from './mssql'
import { MSSQL_GENERATORS } from './mssql/generators'
import { mysqlSeedConfig } from './mysql'
import { MYSQL_GENERATORS } from './mysql/generators'
import { pgSeedConfig } from './postgres'
import { PG_GENERATORS } from './postgres/generators'

export const SKIP_GENERATOR = 'skip-generator'
export const REFERENCE_GENERATOR = 'reference-generator'
export const ENUM_GENERATOR = 'enum-generator'
export const CUSTOM_GENERATOR = 'custom-generator'

export interface GeneratorDef {
  label: string
  category: string
  generate: () => unknown
}

export type GeneratorMap<D extends ConnectionType | '' = ''> = Record<D extends '' ? string : `${D}.${string}`, GeneratorDef>

export interface Generator {
  generatorId: GeneratorId
  isNullable: boolean
  customExpression?: string
}

export interface GeneratorGroup {
  value: string
  items: string[]
}

export interface DialectSeedConfig {
  generators: GeneratorMap
  autoDetect: (label: string) => GeneratorId | undefined
  shouldSkip?: (column: Column) => boolean
  transformArray?: (items: unknown[], type: string) => unknown
  transformValue?: (value: unknown, column: Column) => unknown
}

export const GENERATORS = {
  ...BASE_GENERATORS,
  ...PG_GENERATORS,
  ...MYSQL_GENERATORS,
  ...MSSQL_GENERATORS,
} satisfies GeneratorMap

export type GeneratorId<D extends ConnectionType | '' = ''> = D extends ''
  ? keyof typeof GENERATORS
  : Extract<keyof typeof GENERATORS, `${D}.${string}`>

const DIALECT_CONFIGS: Partial<Record<ConnectionType, DialectSeedConfig>> = {
  postgres: pgSeedConfig,
  mysql: mysqlSeedConfig,
  mssql: mssqlSeedConfig,
}

export function getGenerators(dialect: ConnectionType): Partial<Record<GeneratorId, GeneratorDef>> {
  const config = dialect ? DIALECT_CONFIGS[dialect] : undefined
  return config ? { ...GENERATORS, ...config.generators } : GENERATORS
}

export function getGeneratorGroups(dialect: ConnectionType): GeneratorGroup[] {
  return Object.entries(getGenerators(dialect)).reduce<GeneratorGroup[]>(
    (groups, [id, gen]) => {
      const group = groups.find(g => g.value === gen.category)
      if (group) {
        group.items.push(id)
        return groups
      }
      return [...groups, { value: gen.category, items: [id] }]
    },
    [],
  )
}

export function autoDetectGenerator(column: Column, dialect: ConnectionType): GeneratorId {
  const name = column.id.toLowerCase().replaceAll('_', '')
  const label = (column.label?.toLowerCase() ?? '').replace('[]', '')
  const type = (column.type?.toLowerCase() ?? '').replace('[]', '')

  if (column.foreign)
    return REFERENCE_GENERATOR

  if (column.enumName && column.availableValues && column.availableValues.length > 0)
    return ENUM_GENERATOR

  const config = DIALECT_CONFIGS[dialect]

  if (config?.shouldSkip?.(column))
    return SKIP_GENERATOR

  if (column.defaultValue)
    return SKIP_GENERATOR

  const dialectResult = config?.autoDetect(label)
  if (dialectResult)
    return dialectResult

  return baseAutoDetectGenerator(name, type)
}

function generateValue({ generator, column, generators, referenceValues }: {
  generator: Generator
  column: Column
  generators: Partial<Record<GeneratorId, GeneratorDef>>
  referenceValues?: unknown[]
}): unknown {
  const generatorId = generator.generatorId
  const generatorImpl = generators[generatorId]

  if (!generatorImpl || generatorId === SKIP_GENERATOR)
    return undefined

  if (generatorId === 'null')
    return null

  if (generatorId === CUSTOM_GENERATOR && generator.customExpression?.trim()) {
    return sql.raw(`(${generator.customExpression.trim()})`)
  }

  if (generator.isNullable && column.isNullable && faker.datatype.boolean())
    return null

  if (generatorId === REFERENCE_GENERATOR) {
    if (!referenceValues || referenceValues.length === 0) {
      throw new Error(
        `Cannot generate seed data: no reference values available for column "${column.id}".`,
      )
    }

    if (column.isArray) {
      const count = faker.number.int({ min: 1, max: 5 })
      return faker.helpers.multiple(() => faker.helpers.arrayElement(referenceValues), { count })
    }

    return faker.helpers.arrayElement(referenceValues)
  }

  if (generatorId === ENUM_GENERATOR) {
    if (!column.availableValues || column.availableValues.length === 0) {
      throw new Error(
        `Cannot generate seed data: no enum values available for column "${column.id}".`,
      )
    }

    if (column.isArray) {
      const count = faker.number.int({ min: 1, max: Math.min(5, column.availableValues.length) })
      return faker.helpers.arrayElements(column.availableValues, count)
    }

    return faker.helpers.arrayElement(column.availableValues)
  }

  if (column.isArray) {
    const count = faker.number.int({ min: 1, max: 5 })
    return faker.helpers.multiple(() => generatorImpl.generate(), { count })
  }

  return generatorImpl.generate()
}

export function generateRows({ columns, columnGenerators, count, dialect, referenceData }: {
  columns: Column[]
  columnGenerators: Record<string, Generator>
  count: number
  dialect: ConnectionType
  referenceData?: Record<string, unknown[]>
}) {
  const generators = getGenerators(dialect)

  const config = DIALECT_CONFIGS[dialect]

  return Array.from({ length: count }, () => {
    const row: Record<string, unknown> = {}

    for (const column of columns) {
      const generator = columnGenerators[column.id]
      if (!generator || generator.generatorId === SKIP_GENERATOR)
        continue

      let value = generateValue({
        generator,
        column,
        generators,
        referenceValues: referenceData?.[column.id],
      })

      if (value === undefined)
        continue

      if (column.isArray && Array.isArray(value) && config?.transformArray)
        value = config.transformArray(value, column.type?.toLowerCase() ?? '')

      if (config?.transformValue)
        value = config.transformValue(value, column)

      if (typeof value === 'string' && column.maxLength && column.maxLength > 0 && value.length > column.maxLength)
        value = value.slice(0, column.maxLength)

      row[column.id] = value
    }

    return row
  })
}
