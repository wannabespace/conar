import type { AnyTextAdapter } from '@tanstack/ai'
import { anthropicText } from '@tanstack/ai-anthropic'

export const chatAdapter: AnyTextAdapter = anthropicText('claude-opus-5')
export const fastAdapter: AnyTextAdapter = anthropicText('claude-haiku-4-5')
export const sqlAdapter: AnyTextAdapter = anthropicText('claude-sonnet-5')
