import { type } from 'arktype'

export const databaseContextType = type({
  schemas: type({
    schema: 'string',
    tables: type({
      name: 'string',
      columns: type({
        name: 'string',
        type: 'string',
        nullable: 'boolean',
        default: 'string | null',
      }).array(),
    }).array().or('null'),
  }).array().or('null'),
  enums: type({
    schema: 'string',
    name: 'string',
    value: 'string',
  }).array().or('null'),
})
