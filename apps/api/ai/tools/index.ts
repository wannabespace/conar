import type { InferUITools } from 'ai'
import { SQL_FILTERS_LIST } from '@conar/shared/filters'
import { webSearch } from '@exalabs/ai-sdk'
import { queryDocs, resolveLibraryId } from '@upstash/context7-tools-ai-sdk'
import { tool } from 'ai'
import * as z from 'zod/mini'
import { env } from '~/env'

export const tools = {
  columns: tool({
    description: 'Use this tool if you need to get the list of columns in a table.',
    inputSchema: z.object({
      tableAndSchema: z.object({
        tableName: z.string(),
        schemaName: z.string(),
      }),
    }),
    outputSchema: z.array(
      z.object({
        isEditable: z.boolean(),
        isNullable: z.boolean(),
        table: z.string(),
        id: z.string(),
        type: z.string(),
        default: z.union([z.string(), z.null()]),
      }),
    ),
  }),
  enums: tool({
    description: 'Use this tool if you need to get the list of enums in a database',
    inputSchema: z.object({}),
    outputSchema: z.array(
      z.object({
        schema: z.string(),
        name: z.string(),
        value: z.string(),
      }),
    ),
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
      whereConcatOperator: z.enum(['AND', 'OR']),
      whereFilters: z.array(
        z.object({
          column: z.string(),
          operator: z.enum(SQL_FILTERS_LIST.map(filter => filter.operator) as [string, ...string[]]),
          values: z.array(z.string()),
        }),
      ),
      select: z.array(z.string()),
      limit: z.number(),
      offset: z.number(),
      orderBy: z.union([
        z.record(z.string(), z.enum(['ASC', 'DESC'])),
        z.null(),
      ]),
      tableAndSchema: z.object({
        tableName: z.string(),
        schemaName: z.string(),
      }),
    }),
    outputSchema: z.unknown(),
  }),
  ...(env.EXA_API_KEY && { webSearch: webSearch({ apiKey: env.EXA_API_KEY }) }),
  ...(env.CONTEXT7_API_KEY && {
    resolveLibraryId: resolveLibraryId({ apiKey: env.CONTEXT7_API_KEY }),
    queryDocs: queryDocs({ apiKey: env.CONTEXT7_API_KEY }),
  }),
}

export type AITools = InferUITools<typeof tools>
