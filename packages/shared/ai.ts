import type { InferUITools, UIDataTypes, UIMessage } from 'ai'
import { tool } from 'ai'
import { type } from 'arktype'
import * as z from 'zod'
import { DatabaseType } from './enums/database-type'
import { SQL_OPERATORS } from './utils/sql'

export const chatInputType = type({
  id: 'string.uuid.v7',
  type: type.valueOf(DatabaseType),
  context: 'string?',
  prompt: 'object' as type.cast<AppUIMessage>,
  databaseId: 'string.uuid.v7',
  fallback: 'boolean?',
  trigger: '"submit-message" | "regenerate-message"',
  messageId: 'string.uuid.v7?',
})

export const tools = {
  columns: tool({
    description: 'Use this tool if you need to get the list of columns in a table.',
    inputSchema: z.object({
      tableName: z.string(),
      schemaName: z.string(),
    }),
    outputSchema: z.array(z.object({
      isEditable: z.boolean(),
      isNullable: z.boolean(),
      table: z.string(),
      name: z.string(),
      type: z.string(),
      default: z.string().nullable(),
    })),
  }),
  enums: tool({
    description: 'Use this tool if you need to get the list of enums in a database',
    inputSchema: z.object({}),
    outputSchema: z.array(z.object({
      schema: z.string(),
      name: z.string(),
      value: z.string(),
    })),
  }),
  select: tool({
    description: `
      Use this tool to select data from the database to improve your response.
      Do not select any sensitive data, avoid columns like password, token, secret, etc.
      tableName and schemaName will be concatenated to "schemaName.tableName".
      Do not use any tables and schemas that are not provided in the input.
      For tableName use only table without schema prefix.
    `,
    inputSchema: z.object({
      whereConcatOperator: z.enum(['AND', 'OR']).describe('The operator to use to concatenate the where clauses'),
      whereFilters: z.array(z.object({
        column: z.string(),
        operator: z.enum(SQL_OPERATORS).describe('The operator to use in the where clause'),
        value: z.string().optional().describe('The value to use in the where clause. If the operator does not require a value, this should be undefined'),
      })).describe('The columns to use in the where clause'),
      select: z.array(z.string()).optional().describe('The columns to select. If not provided, all columns will be selected'),
      limit: z.number().describe('The number of rows to return. Do not ask for more than 100 rows.'),
      offset: z.number().describe('The number of rows to skip'),
      orderBy: z.record(z.string(), z.enum(['ASC', 'DESC'])).optional().describe('The columns to order by'),
      tableName: z.string().describe('The name of the table to query'),
      schemaName: z.string().describe('The name of the schema to query'),
    }),
    outputSchema: z.record(z.string(), z.any()),
  }),
}

export type AppUIMessage = UIMessage<
  {
    createdAt: number
  },
  UIDataTypes,
  InferUITools<typeof tools>
>
