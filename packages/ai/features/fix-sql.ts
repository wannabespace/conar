import type { TelemetryOptions } from 'ai'
import { generateText } from 'ai'

import { models } from '../models/list'
import { section, sqlOutputRules } from './prompt'

const fixSqlInstructions = (data: {
  connectionType: string
  context: string
}) =>
  [
    'You are an expert at fixing SQL queries based on an error message.',
    'Fix the query so it is valid and correct, preserving its format and styling.',
    'If the query is already valid and correct, return it unchanged.',
    'Use only tables and columns from the schema; never invent a name it does not list.',
    ...sqlOutputRules(data.connectionType),
    '',
    'Database schema:',
    data.context,
  ].join('\n')

export const fixSql = async (data: {
  connectionType: string
  context: string
  error: string
  signal?: AbortSignal
  sql: string
  telemetry?: TelemetryOptions
}) => {
  const { text } = await generateText({
    abortSignal: data.signal,
    instructions: fixSqlInstructions(data),
    model: models.sql,
    prompt: [section('SQL QUERY', data.sql), section('ERROR', data.error)].join(
      '\n'
    ),
    telemetry: data.telemetry,
  })
  return text
}
