import { webSearch } from '@exalabs/ai-sdk'
import { SQL_FILTERS_LIST } from '@tamery/shared/filters'
import { queryDocs, resolveLibraryId } from '@upstash/context7-tools-ai-sdk'
import type { ToolSet } from 'ai'
import { tool } from 'ai'
import * as z from 'zod/mini'

export const createTools = (keys: {
  context7ApiKey?: string
  exaApiKey?: string
}): ToolSet => ({
  columns: tool({
    description:
      'Use this tool if you need to get the list of columns in a table.',
    inputSchema: z.object({
      tableAndSchema: z.object({
        schemaName: z.string(),
        tableName: z.string(),
      }),
    }),
    outputSchema: z.array(
      z.object({
        default: z.union([z.string(), z.null()]),
        id: z.string(),
        isEditable: z.boolean(),
        isNullable: z.boolean(),
        table: z.string(),
        type: z.string(),
      })
    ),
  }),
  enums: tool({
    description:
      'Use this tool if you need to get the list of enums in a database',
    inputSchema: z.object({}),
    outputSchema: z.array(
      z.object({
        name: z.string(),
        schema: z.string(),
        value: z.string(),
      })
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
      limit: z.number(),
      offset: z.number(),
      orderBy: z.union([
        z.record(z.string(), z.enum(['ASC', 'DESC'])),
        z.null(),
      ]),
      select: z.array(z.string()),
      tableAndSchema: z.object({
        schemaName: z.string(),
        tableName: z.string(),
      }),
      whereConcatOperator: z.enum(['AND', 'OR']),
      whereFilters: z.array(
        z.object({
          column: z.string(),
          operator: z.enum(
            SQL_FILTERS_LIST.map((filter) => filter.operator) as [
              string,
              ...string[],
            ]
          ),
          values: z.array(z.string()),
        })
      ),
    }),
    outputSchema: z.unknown(),
  }),
  ...(keys.exaApiKey && { webSearch: webSearch({ apiKey: keys.exaApiKey }) }),
  ...(keys.context7ApiKey && {
    queryDocs: queryDocs({ apiKey: keys.context7ApiKey }),
    resolveLibraryId: resolveLibraryId({ apiKey: keys.context7ApiKey }),
  }),
})
