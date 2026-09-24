import type { TelemetryOptions } from 'ai'
import { generateText } from 'ai'

import { models } from '../models/list'
import { section } from './prompt'

const completeSqlInstructions = (data: {
  connectionType: string
  context: string
}) =>
  [
    'You are an inline SQL completion engine inside a SQL editor.',
    `The database type is "${data.connectionType}".`,
    'You get the text before the caret and the text after it.',
    'Return only the text to insert at the caret: no explanations, markdown or fences.',
    'Never repeat what is already before the caret; continue it in the same style and casing.',
    'Your text is inserted directly at the caret: start with a space when it begins a new word after a finished one.',
    'Finish only the current statement, at most a few lines, and stop at its end: never start another statement. Use only tables and columns from the schema.',
    'The SQL runs as typed, with nothing bound: never use placeholders or bind parameters ($1, ?, :name, @p1). Write literal values; when the value is unknown, use a realistic example literal the user can edit.',
    'Return an empty response when nothing useful can be suggested.',
    '',
    'Database schema:',
    data.context,
  ].join('\n')

export const completeSql = async (data: {
  connectionType: string
  context: string
  prefix: string
  signal?: AbortSignal
  suffix: string
  telemetry?: TelemetryOptions
}) => {
  const { text } = await generateText({
    abortSignal: data.signal,
    // The instructions and schema repeat on every keystroke's request; Anthropic caches them so a
    // fallback answer reads only the lines around the caret. Other providers ignore the option.
    instructions: {
      content: completeSqlInstructions(data),
      providerOptions: {
        anthropic: { cacheControl: { type: 'ephemeral' } },
      },
      role: 'system',
    },
    maxOutputTokens: 200,
    model: models.completion,
    prompt: [
      section('TEXT BEFORE CARET', data.prefix),
      section('TEXT AFTER CARET', data.suffix),
    ].join('\n'),
    telemetry: data.telemetry,
  })
  return text
}
