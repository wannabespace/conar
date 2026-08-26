import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'
import { createRetryableModel } from 'ai-retry/language-model'

export const model = createRetryableModel({
  model: anthropic('claude-opus-4-8'),
  retries: [openai('gpt-5.3-codex'), google('gemini-pro-latest')],
})
