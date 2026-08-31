import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'
import { xai } from '@ai-sdk/xai'
import { generateText } from 'ai'

const probeModels = {
  anthropic: anthropic('claude-opus-4-6'),
  google: google('gemini-flash-latest'),
  openai: openai('gpt-5-nano'),
  xai: xai('grok-4-latest'),
}

export type AiProvider = keyof typeof probeModels

export const aiProviders = Object.keys(probeModels) as AiProvider[]

export const probeProvider = async (provider: AiProvider) => {
  const { text } = await generateText({
    model: probeModels[provider],
    prompt: 'Hello, how are you?',
  })
  return text
}
