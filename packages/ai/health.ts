import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'
import { xai } from '@ai-sdk/xai'
import { generateText } from 'ai'

const probeModels = {
  anthropic: anthropic('claude-haiku-4-5'),
  google: google('gemini-flash-latest'),
  openai: openai('gpt-5-nano'),
  xai: xai('grok-latest'),
}

export type AiProvider = keyof typeof probeModels

export const providers = {
  list: Object.keys(probeModels) as AiProvider[],
  probe: async (provider: AiProvider) => {
    const { text } = await generateText({
      maxOutputTokens: 8,
      model: probeModels[provider],
      prompt: 'Reply with the single word: ok',
    })
    return text
  },
}
