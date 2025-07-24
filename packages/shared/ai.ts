import type { InferUITools, ToolCallUnion, ToolResultUnion } from 'ai'
import { tool } from 'ai'
import * as z from 'zod'
import { columnSchema } from './sql/columns'
import { enumSchema } from './sql/enums'
import { SQL_OPERATORS } from './utils/sql'

export const tools = {
  columns: tool({
    description: 'Use this tool to get the schema of columns in a table',
    inputSchema: z.object({
      tableName: z.string(),
      schemaName: z.string(),
    }),
    outputSchema: z.array(columnSchema),
  }),
  enums: tool({
    description: 'Use this tool to get the schema of enums in a database',
    inputSchema: z.object({}),
    outputSchema: z.array(enumSchema),
  }),
  query: tool({
    description: 'Use this tool to execute a SQL query if you need to get data from the database. Do not include any sensitive data.',
    inputSchema: z.object({
      whereConcatOperator: z.enum(['AND', 'OR']).describe('The operator to use to concatenate the where clauses'),
      whereFilters: z.array(z.object({
        column: z.string(),
        operator: z.enum(SQL_OPERATORS).describe('The operator to use in the where clause'),
        value: z.string().optional().describe('The value to use in the where clause. If the operator does not require a value, this should be undefined'),
      })).describe('The columns to use in the where clause'),
      limit: z.number().describe('The number of rows to return'),
      offset: z.number().describe('The number of rows to skip'),
      orderBy: z.record(z.string(), z.enum(['ASC', 'DESC'])).describe('The columns to order by'),
      tableName: z.string().describe('The name of the table to query'),
      schemaName: z.string().describe('The name of the schema to query'),
    }),
    outputSchema: z.string(),
  }),
}

export type ToolCall = ToolCallUnion<typeof tools>
export type ToolResult = ToolResultUnion<typeof tools>
export type UITools = InferUITools<typeof tools>
