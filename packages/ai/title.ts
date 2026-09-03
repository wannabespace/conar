import { generateText } from 'ai'

import type { AppUIMessage } from './message'
import { textFromMessage } from './message'
import { fastModel } from './models'

const TITLE_INSTRUCTIONS = [
  'Generate a title for a chat from its first user message.',
  "Use the user's language and stay as close to the message as possible.",
  'At most 30 characters, sentence case, no trailing punctuation, no quotes.',
  'Example: Update component in React',
  'Return only the title text.',
].join('\n')

export const generateChatTitle = async (data: {
  messages: AppUIMessage[]
  signal?: AbortSignal
}) => {
  const firstUserMessage = data.messages.find(
    (message) => message.role === 'user'
  )
  const prompt = firstUserMessage ? textFromMessage(firstUserMessage) : ''
  if (!prompt) {
    return null
  }

  const { text } = await generateText({
    abortSignal: data.signal,
    instructions: TITLE_INSTRUCTIONS,
    maxOutputTokens: 32,
    model: fastModel,
    prompt,
  })

  return text.trim() || null
}
