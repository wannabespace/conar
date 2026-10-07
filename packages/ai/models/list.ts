import { openrouter } from '@openrouter/ai-sdk-provider'
import { createRetryableModel } from 'ai-retry/language-model'

export const models = {
  chat: createRetryableModel({
    model: openrouter('anthropic/claude-opus-5'),
    retries: [
      openrouter('openai/gpt-5.6-sol'),
      openrouter('~x-ai/grok-latest'),
      openrouter('~google/gemini-pro-latest'),
    ],
  }),
  fast: createRetryableModel({
    model: openrouter('anthropic/claude-haiku-4.5'),
    retries: [openrouter('~google/gemini-flash-latest')],
  }),
  filters: createRetryableModel({
    model: openrouter('anthropic/claude-sonnet-5'),
    retries: [openrouter('~x-ai/grok-latest')],
  }),
  sql: createRetryableModel({
    model: openrouter('anthropic/claude-opus-5'),
    retries: [openrouter('~x-ai/grok-latest')],
  }),
}
