import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'
import { createRetryableModel } from 'ai-retry/language-model'

export const chatModel = createRetryableModel({
  model: anthropic('claude-opus-5'),
  retries: [openai('gpt-5.3-codex'), google('gemini-pro-latest')],
})

export const fastModel = createRetryableModel({
  model: anthropic('claude-haiku-4-5'),
  retries: [google('gemini-flash-latest')],
})

export const sqlModel = createRetryableModel({
  model: anthropic('claude-sonnet-5'),
  retries: [openai('gpt-5.3-codex')],
})
