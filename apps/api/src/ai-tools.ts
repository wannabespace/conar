import type { InferUITools, Tool, UIDataTypes, UIMessage } from 'ai'
import { SQL_FILTERS_LIST } from '@conar/shared/filters/sql'
import { webSearch } from '@exalabs/ai-sdk'
import {
  AGENT_PROMPT as CONTEXT7_AGENT_PROMPT,
  GET_LIBRARY_DOCS_DESCRIPTION,
  getLibraryDocs,
  RESOLVE_LIBRARY_DESCRIPTION,
  resolveLibrary,
} from '@upstash/context7-tools-ai-sdk'
import { tool } from 'ai'
import { consola } from 'consola'
import * as z from 'zod'
import { env } from '~/env'

function getContext7Config() {
  if (!env.CONTEXT7_API_KEY) {
    consola.warn('CONTEXT7_API_KEY is not set, Context7 tools will not be available')
    return null
  }
  return {
    apiKey: env.CONTEXT7_API_KEY,
    defaultMaxResults: 15,
  }
}

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
      schema: z.string(),
      table: z.string(),
      id: z.string(),
      default: z.string().nullable(),
      type: z.string(),
      enum: z.string().optional(),
      isArray: z.boolean().optional(),
      isEditable: z.boolean(),
      isNullable: z.boolean(),
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
        operator: z.enum(SQL_FILTERS_LIST.map(filter => filter.operator)).describe('The operator to use in the where clause'),
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
    outputSchema: z.union([
      z.array(z.record(z.string(), z.unknown())),
      z.object({ error: z.string() }),
    ]),
  }),
  webSearch: webSearch({ apiKey: env.EXA_API_KEY }),
}

export function createContext7Tools(): Record<string, Tool> {
  const config = getContext7Config()
  if (!config) {
    return {}
  }
  return {
    resolveLibrary: resolveLibrary(config),
    getLibraryDocs: getLibraryDocs(config),
  }
}

export function getContext7SystemPrompt(): string {
  return CONTEXT7_AGENT_PROMPT
}

export const context7ToolDescriptions = {
  resolveLibrary: RESOLVE_LIBRARY_DESCRIPTION,
  getLibraryDocs: GET_LIBRARY_DOCS_DESCRIPTION,
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
