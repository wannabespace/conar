import type { InferUITools, UIDataTypes, UIMessage } from 'ai'
import { tool } from 'ai'
import * as z from 'zod'
import { SQL_OPERATORS } from './filters/sql'

export const tools = {
  columns: tool({
    description: 'Use this tool if you need to get the list of columns in a table.',
    inputSchema: z.object({
      tableAndSchema: z.object({
        tableName: z.string(),
        schemaName: z.string(),
      }),
    }),
    outputSchema: z.array(z.object({
      isEditable: z.boolean(),
      isNullable: z.boolean(),
      table: z.string(),
      id: z.string(),
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
    description: [
      'Use this tool to select data from the database to improve your response.',
      'Do not abuse this tool, unless you are 100% sure that the data will help to answer the question.',
      'Do not select any sensitive data, like password, token, secret, card number, etc.',
      'Mask sensitive data with asterisks if need to select to answer the question.',
      'Do not use any tables and schemas that are not provided in the input.',
      'tableName and schemaName will be concatenated to "schemaName.tableName".',
      'For tableName use only table without schema prefix.',
    ].join('\n'),
    inputSchema: z.object({
      whereConcatOperator: z.enum(['AND', 'OR']).describe('The operator to use to concatenate the where clauses'),
      whereFilters: z.array(z.object({
        column: z.string(),
        operator: z.enum(SQL_OPERATORS).describe('The operator to use in the where clause'),
        values: z.array(z.string()).describe('The value to use in the where clause. If the operator does not require a value, this should be empty array.'),
      })).describe('The columns to use in the where clause'),
      select: z.array(z.string()).optional().describe('The columns to select. If not provided, all columns will be selected'),
      limit: z.number().describe('The number of rows to return.'),
      offset: z.number().describe('The number of rows to skip'),
      orderBy: z.record(z.string(), z.enum(['ASC', 'DESC'])).optional().describe('The columns to order by'),
      tableAndSchema: z.object({
        tableName: z.string().describe('The name of the table to query'),
        schemaName: z.string().describe('The name of the schema to query'),
      }).describe('The name of the table and schema to query'),
    }),
    outputSchema: z.any(),
  }),
}

export type AppUIMessage = UIMessage<
  {
    updatedAt?: Date
    createdAt?: Date
  },
  UIDataTypes,
  InferUITools<typeof tools>
>

export function convertToAppUIMessage(message: UIMessage): AppUIMessage {
  return message as AppUIMessage
}
