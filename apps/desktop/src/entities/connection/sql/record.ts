import type { connections } from '~/drizzle'
import type { Column } from '~/entities/connection/components/table/utils'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { createId } from '@paralleldrive/cuid2'
import { toast } from 'sonner'
import { v7 } from 'uuid'
import { queryClient } from '~/main'
import { connectionConstraintsQuery } from '../queries/constraints'
import { createQuery } from '../query'

export interface ExtendedColumn extends Column {
  defaultValue?: string | null
  isPrimary?: boolean
  default?: string | null
}

export function prepareValue(value: unknown, type?: string, database?: typeof connections.$inferSelect): unknown {
  if (!type)
    return value

  if ((type === 'cuid' || type === 'cuid2' || type === 'char') && typeof value === 'string') {
    if (value.includes('-')) {
      return value.replace(/-/g, '').substring(0, 24)
    }
  }

  if (typeof value === 'string' && type.endsWith('[]')) {
    try {
      return JSON.parse(value)
    }
    catch (error) {
      toast.error(`Invalid array input: Please enter a valid JSON array. ${error instanceof Error ? error.message : String(error)}`)
      console.error('Invalid array input:', error)
      return value
    }
  }

  if (
    value instanceof Date
    && (type.includes('date') || type.includes('time'))
  ) {
    if (database?.type === ConnectionType.Postgres) {
      return value.toISOString()
    }
    else if (database?.type === ConnectionType.MySQL) {
      const pad = (num: number) => String(num).padStart(2, '0')

      const year = value.getFullYear()
      const month = pad(value.getMonth() + 1)
      const day = pad(value.getDate())
      const hours = pad(value.getHours())
      const minutes = pad(value.getMinutes())
      const seconds = pad(value.getSeconds())

      if (type.includes('time')) {
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
      }
      else {
        return `${year}-${month}-${day}`
      }
    }
    return value
  }

  return value
}

export async function getPrimaryKeyColumns(db: typeof connections.$inferSelect, schema: string, tableName: string): Promise<string[]> {
  try {
    const constraints = await queryClient.fetchQuery(
      connectionConstraintsQuery({ connection: db }),
    )

    return constraints
      .filter(
        c =>
          c.schema === schema
          && c.table === tableName
          && c.type === 'primaryKey'
          && c.column,
      )
      .map(c => c.column as string)
  }
  catch (error) {
    console.error('Error getting primary keys:', error)
    return []
  }
}

export function buildInitialValues(
  database: typeof connections.$inferSelect,
  primaryKeyColumns: string[],
  table: string,
  columnsWithPrimary: ExtendedColumn[],
): Record<string, unknown> {
  const initialValues: Record<string, unknown> = {}

  columnsWithPrimary.forEach((col) => {
    if (col.type === 'boolean') {
      initialValues[col.id] = false
    }
    let isPrimary = primaryKeyColumns.includes(col.id)

    if (primaryKeyColumns.length === 0) {
      if (
        col.id === 'id'
        || col.id === '_id'
        || (col.id.endsWith('_id') && col.id.startsWith(table.toLowerCase()))
        || (col.id.endsWith('Id') && col.id.startsWith(table.toLowerCase()))
      ) {
        isPrimary = true
      }

      if (
        (
          col.type === 'uuid'
          || col.type === 'cuid'
          || col.type?.includes('int')
          || col.type?.includes('serial')
        )
        && (col.id === 'id' || col.id.endsWith('Id') || col.id.endsWith('_id'))
      ) {
        isPrimary = true
      }
    }

    const defaultVal = col.defaultValue || col.default
    const hasAutoDefault = defaultVal
      && (defaultVal?.includes('nextval')
        || defaultVal?.includes('auto_increment')
        || defaultVal?.includes('GENERATED')
        || defaultVal?.includes('IDENTITY'))

    if (isPrimary) {
      if (
        (col.type?.includes('int') || col.type?.includes('serial') || col.type?.includes('number'))
        && (hasAutoDefault || col.type?.includes('serial'))
      ) {
        initialValues[col.id] = '(Auto-generated)'
      }

      else if (col.type === 'bigint' || col.type?.includes('int8')) {
        initialValues[col.id] = ''
      }

      else if (col.type === 'uuid' && !hasAutoDefault) {
        initialValues[col.id] = v7()
      }

      else if ((col.type === 'cuid' || col.type === 'cuid2') && !hasAutoDefault) {
        initialValues[col.id] = createId()
      }
      else if (col.type === 'char' && database?.type === ConnectionType.MySQL && !hasAutoDefault) {
        let charLength = 24
        if (col.type && typeof col.type === 'string') {
          const lengthMatch = col.type.match(/\((\d+)\)/)
          if (lengthMatch && lengthMatch[1]) {
            charLength = Number.parseInt(lengthMatch[1], 10)
          }
        }

        if (charLength >= 36) {
          initialValues[col.id] = v7()
        }
        else if (charLength >= 32) {
          initialValues[col.id] = v7().replace(/-/g, '')
        }
        else if (charLength >= 24) {
          initialValues[col.id] = createId()
        }
        else {
          initialValues[col.id] = createId().substring(0, charLength)
        }
      }

      else if ((col?.type?.includes('text') || col.type?.includes('char')) && !hasAutoDefault) {
        if (database?.type === ConnectionType.Postgres) {
          initialValues[col.id] = v7()
        }

        else {
          initialValues[col.id] = v7().replace(/-/g, '').substring(0, 24)
        }
      }
      else if (hasAutoDefault) {
        initialValues[col.id] = '(Auto-generated)'
      }
      else {
        initialValues[col.id] = null
      }
    }
    else if (!hasAutoDefault) {
      initialValues[col.id] = null
    }

    if (col.type?.includes('time') || col.type?.includes('date')) {
      if (hasAutoDefault) {
        initialValues[col.id] = '(Auto-generated)'
      }
      else {
        initialValues[col.id] = new Date()
      }
    }
  })

  return initialValues
}

export function buildInsertPayload(
  connection: typeof connections.$inferSelect,
  columns: ExtendedColumn[],
  values: Record<string, unknown>,
): { columns: string[], values: unknown[] } | null {
  const raw = { ...values }

  columns.forEach((column) => {
    if (raw[column.id] === '(Auto-generated)') {
      delete raw[column.id]
    }
    else if (column.type?.includes('time') || column.type?.includes('date')) {
      if (!column.isNullable && !column.defaultValue && (raw[column.id] === null || raw[column.id] === '')) {
        raw[column.id] = new Date()
      }
    }
  })

  columns.forEach((col) => {
    if (col.type === 'boolean' && (raw[col.id] === undefined || raw[col.id] === null)) {
      raw[col.id] = false
    }
  })

  const columnNames = Object.keys(raw).filter((colId) => {
    const column = columns.find(c => c.id === colId)

    if (column && (column.type?.includes('time') || column.type?.includes('date')))
      return true
    if (column && column.type === 'boolean')
      return true
    if (raw[colId] !== undefined)
      return true

    return !!column && !column.isNullable && !column.defaultValue
  })

  if (columnNames.length === 0)
    return null

  const filteredColumnNames = columnNames.filter(colId => raw[colId] !== '(Auto-generated)')

  const valueParams = filteredColumnNames.map(colId =>
    prepareValue(raw[colId], columns.find(c => c.id === colId)?.type, connection),
  )

  return {
    columns: filteredColumnNames,
    values: valueParams,
  }
}

export const insertRecordQuery = createQuery({
  query: ({
    schema,
    table,
    columns,
    values,
  }: {
    schema: string
    table: string
    columns: string[]
    values: unknown[]
  }) => ({
    postgres: (db) => {
      const payload = Object.fromEntries(
        columns.map((col, idx) => [col, values[idx]]),
      )

      return db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .insertInto(table)
        .values(payload)
        .execute()
    },
    mysql: (db) => {
      const payload = Object.fromEntries(
        columns.map((col, idx) => [col, values[idx]]),
      )

      return db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .insertInto(table)
        .values(payload)
        .execute()
    },
    mssql: (db) => {
      const payload = Object.fromEntries(
        columns.map((col, idx) => [col, values[idx]]),
      )

      return db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .insertInto(table)
        .values(payload)
        .execute()
    },
    clickhouse: (db) => {
      const payload = Object.fromEntries(
        columns.map((col, idx) => [col, values[idx]]),
      )

      return db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .insertInto(table)
        .values(payload)
        .execute()
    },
  }),
})
