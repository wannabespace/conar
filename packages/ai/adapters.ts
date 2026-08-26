import { anthropicText } from '@tanstack/ai-anthropic'

export const chatAdapter = anthropicText('claude-opus-5')
export const fastAdapter = anthropicText('claude-haiku-4-5')
export const sqlAdapter = anthropicText('claude-sonnet-5')
