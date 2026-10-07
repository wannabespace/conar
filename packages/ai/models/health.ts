import { openrouter } from '@openrouter/ai-sdk-provider'
import { generateText } from 'ai'

export const probeOpenRouter = async () => {
  const { text } = await generateText({
    maxOutputTokens: 8,
    model: openrouter('anthropic/claude-haiku-4.5'),
    prompt: 'Reply with the single word: ok',
  })
  return text
}
