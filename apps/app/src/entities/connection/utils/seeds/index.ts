import { faker } from '@faker-js/faker'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { sql } from 'kysely'

import type { Column } from '../../components/table/cell/utils'
import { baseAutoDetectGenerator } from './base'
import { mssqlSeedConfig } from './mssql'
import { mysqlSeedConfig } from './mysql'
import { pgSeedConfig } from './postgres'
import type { DialectSeedConfig, Generator, GeneratorId } from './registry'
import { GENERATORS } from './registry'
import type { GeneratorDef, GeneratorGroup } from './types'
import {
  CUSTOM_GENERATOR,
  ENUM_GENERATOR,
  REFERENCE_GENERATOR,
  SKIP_GENERATOR,
} from './types'

const DIALECT_CONFIGS: Partial<Record<ConnectionType, DialectSeedConfig>> = {
  mssql: mssqlSeedConfig,
  mysql: mysqlSeedConfig,
  postgres: pgSeedConfig,
}

export const getGenerators = (
  dialect: ConnectionType
): Partial<Record<GeneratorId, GeneratorDef>> => {
  const config = dialect ? DIALECT_CONFIGS[dialect] : undefined
  return config ? { ...GENERATORS, ...config.generators } : GENERATORS
}

export const getGeneratorGroups = (
  dialect: ConnectionType
): GeneratorGroup[] => {
  const groups: GeneratorGroup[] = []
  for (const [id, gen] of Object.entries(getGenerators(dialect))) {
    const group = groups.find((g) => g.value === gen.category)
    if (group) {
      group.items.push(id)
    } else {
      groups.push({ items: [id], value: gen.category })
    }
  }
  return groups
}

export const autoDetectGenerator = (
  column: Column,
  dialect: ConnectionType
): GeneratorId => {
  const name = column.id.toLowerCase().replaceAll('_', '')
  const typeLabel = (column.typeLabel?.toLowerCase() ?? '').replace('[]', '')

  if (column.foreign) {
    return REFERENCE_GENERATOR
  }

  if (
    column.enumName &&
    column.availableValues &&
    column.availableValues.length > 0
  ) {
    return ENUM_GENERATOR
  }

  const config = DIALECT_CONFIGS[dialect]

  if (config?.shouldSkip?.(column)) {
    return SKIP_GENERATOR
  }

  if (column.defaultValue) {
    return SKIP_GENERATOR
  }

  const dialectResult = config?.autoDetect(typeLabel)
  if (dialectResult) {
    return dialectResult
  }

  return baseAutoDetectGenerator(name, typeLabel)
}

const generateValue = ({
  generator,
  column,
  generators,
  referenceValues,
}: {
  generator: Generator
  column: Column
  generators: Partial<Record<GeneratorId, GeneratorDef>>
  referenceValues?: unknown[]
}): unknown => {
  const { generatorId } = generator
  const generatorImpl = generators[generatorId]

  if (!generatorImpl || generatorId === SKIP_GENERATOR) {
    return undefined
  }

  if (generatorId === 'null') {
    return null
  }

  if (generatorId === CUSTOM_GENERATOR && generator.customExpression?.trim()) {
    return sql.raw(`(${generator.customExpression.trim()})`)
  }

  if (generator.isNullable && column.isNullable && faker.datatype.boolean()) {
    return null
  }

  if (generatorId === REFERENCE_GENERATOR) {
    if (!referenceValues || referenceValues.length === 0) {
      throw new Error(
        `Cannot generate seed data: no reference values available for column "${column.id}".`
      )
    }

    if (column.isArray) {
      const count = faker.number.int({ max: 5, min: 1 })
      return faker.helpers.multiple(
        () => faker.helpers.arrayElement(referenceValues),
        { count }
      )
    }

    return faker.helpers.arrayElement(referenceValues)
  }

  if (generatorId === ENUM_GENERATOR) {
    if (!column.availableValues || column.availableValues.length === 0) {
      throw new Error(
        `Cannot generate seed data: no enum values available for column "${column.id}".`
      )
    }

    if (column.isArray) {
      const count = faker.number.int({
        max: Math.min(5, column.availableValues.length),
        min: 1,
      })
      return faker.helpers.arrayElements(column.availableValues, count)
    }

    return faker.helpers.arrayElement(column.availableValues)
  }

  if (column.isArray) {
    const count = faker.number.int({ max: 5, min: 1 })
    return faker.helpers.multiple(() => generatorImpl.generate(), { count })
  }

  return generatorImpl.generate()
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

  const config = DIALECT_CONFIGS[dialect]

  return Array.from({ length: count }, () => {
    const row: Record<string, unknown> = {}

    for (const column of columns) {
      const generator = columnGenerators[column.id]
      if (!generator || generator.generatorId === SKIP_GENERATOR) {
        continue
      }

      let value = generateValue({
        column,
        generator,
        generators,
        referenceValues: referenceData?.[column.id],
      })

      if (value === undefined) {
        continue
      }

      if (column.isArray && Array.isArray(value) && config?.transformArray) {
        value = config.transformArray(value, column)
      }

      if (config?.transformValue) {
        value = config.transformValue(value, column)
      }

      if (
        typeof value === 'string' &&
        column.maxLength &&
        column.maxLength > 0 &&
        value.length > column.maxLength
      ) {
        value = value.slice(0, column.maxLength)
      }

      row[column.id] = value
    }

    return row
  })
}
