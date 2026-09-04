import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'
import { createRetryableModel } from 'ai-retry/language-model'

export const models = {
  chat: createRetryableModel({
    model: anthropic('claude-opus-5'),
    retries: [openai('gpt-5.3-codex'), google('gemini-pro-latest')],
  }),
  fast: createRetryableModel({
    model: anthropic('claude-haiku-4-5'),
    retries: [google('gemini-flash-latest')],
  }),
  sql: createRetryableModel({
    model: anthropic('claude-sonnet-5'),
    retries: [openai('gpt-5.3-codex')],
  }),
}
