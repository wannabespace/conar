import type { InferUITools, Tool, UIDataTypes, UIMessage } from 'ai'
import { SQL_FILTERS_LIST } from '@conar/shared/filters/sql'
import { webSearch } from '@exalabs/ai-sdk'
import {
  GET_LIBRARY_DOCS_DESCRIPTION,
  getLibraryDocs,
  RESOLVE_LIBRARY_DESCRIPTION,
  resolveLibrary,
} from '@upstash/context7-tools-ai-sdk'
import { tool } from 'ai'
import { type } from 'arktype'
import { env } from '~/env'

const sqlFilterOperatorValues = SQL_FILTERS_LIST.map(filter => filter.operator)
const sqlFilterOperators = type.enumerated(...sqlFilterOperatorValues)

export const tools = {
  columns: tool({
    description: 'Use this tool if you need to get the list of columns in a table.',
    inputSchema: type({
      tableAndSchema: {
        tableName: 'string',
        schemaName: 'string',
      },
    }),
    outputSchema: type({
      schema: 'string',
      table: 'string',
      id: 'string',
      type: 'string',
      default: 'string | null',
      enum: 'string | null',
      isArray: 'boolean | null',
      isEditable: 'boolean',
      isNullable: 'boolean',
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
      whereConcatOperator: `'AND' | 'OR'`,
      whereFilters: type({
        column: 'string',
        operator: sqlFilterOperators,
        values: 'string[]',
      }).array(),
      select: 'string[] | null',
      limit: 'number',
      offset: 'number',
      orderBy: type({ '[string]': `'ASC' | 'DESC'` }).or('null'),
      tableAndSchema: {
        tableName: 'string',
        schemaName: 'string',
      },
    }).configure({
      description: 'Input schema for database select query with filters, ordering, and pagination',
    }),
    outputSchema: type('unknown'),
  }),
  webSearch: webSearch({ apiKey: env.EXA_API_KEY }),
}

function createContext7Tools(): Record<string, Tool> {
  const config = { apiKey: env.CONTEXT7_API_KEY, defaultMaxResults: 15 }

  return {
    resolveLibrary: resolveLibrary(config),
    getLibraryDocs: getLibraryDocs(config),
  }
}

export const context7ToolDescriptions = {
  resolveLibrary: RESOLVE_LIBRARY_DESCRIPTION,
  getLibraryDocs: GET_LIBRARY_DOCS_DESCRIPTION,
}

export function getAllTools(): Record<string, Tool> {
  return Object.assign({}, tools, createContext7Tools())
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
