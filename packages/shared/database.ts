import { type } from 'arktype'

const columnType = type({
  name: 'string',
  type: 'string',
  nullable: 'boolean',
  default: 'string | null',
})

const tableType = type({
  name: 'string',
  columns: columnType.array(),
})

const schemaType = type({
  schema: 'string',
  tables: tableType.array().or('null'),
})

const enumType = type({
  schema: 'string',
  name: 'string',
  value: 'string',
})

export const databaseContextType = type({
  schemas: schemaType.array().or('null'),
  enums: enumType.array().or('null'),
})
