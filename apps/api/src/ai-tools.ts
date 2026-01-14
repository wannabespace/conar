import type { InferUITools, UIDataTypes, UIMessage } from 'ai'
import { SQL_FILTERS_LIST } from '@conar/shared/filters/sql'
import { webSearch } from '@exalabs/ai-sdk'
import { queryDocs, resolveLibraryId } from '@upstash/context7-tools-ai-sdk'
import { tool } from 'ai'
import { type } from 'arktype'
import { env } from '~/env'

const sqlFilterOperators = SQL_FILTERS_LIST.map(filter => `'${filter.operator}'`).join(' | ') as `'${typeof SQL_FILTERS_LIST[number]['operator']}'`

export const tools = {
  columns: tool({
    description: 'Use this tool if you need to get the list of columns in a table.',
    inputSchema: type({
      tableAndSchema: type({
        tableName: 'string',
        schemaName: 'string',
      }),
    }),
    outputSchema: type({
      'schema': 'string',
      'table': 'string',
      'id': 'string',
      'default': 'string | null',
      'type': 'string',
      'enum?': 'string',
      'isArray?': 'boolean',
      'isEditable': 'boolean',
      'isNullable': 'boolean',
    }).array(),
  }),
  enums: tool({
    description: 'Use this tool if you need to get the list of enums in a database',
    inputSchema: type({}),
    outputSchema: type({
      schema: 'string',
      name: 'string',
      value: 'string',
    }).array(),
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
    inputSchema: type({
      'whereConcatOperator': `'AND' | 'OR'`,
      'whereFilters': type({
        column: 'string',
        operator: sqlFilterOperators,
        values: 'string[]',
      }).array(),
      'select?': 'string[]',
      'limit': 'number',
      'offset': 'number',
      'orderBy?': { '[string]': `'ASC' | 'DESC'` },
      'tableAndSchema': {
        tableName: 'string',
        schemaName: 'string',
      },
    }),
    outputSchema: type('Record<string, unknown>[]').or({ error: 'string' }),
  }),
  ...(env.EXA_API_KEY && { webSearch: webSearch({ apiKey: env.EXA_API_KEY }) }),
  ...(env.CONTEXT7_API_KEY && {
    resolveLibraryId: resolveLibraryId({ apiKey: env.CONTEXT7_API_KEY }),
    queryDocs: queryDocs({ apiKey: env.CONTEXT7_API_KEY }),
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
