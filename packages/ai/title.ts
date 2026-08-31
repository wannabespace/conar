import { generateText } from 'ai'

import type { AppUIMessage } from './message'
import { textFromMessage } from './message'
import { fastModel } from './models'

const TITLE_SYSTEM_PROMPT = [
  'You are a title generator that generates a title for a chat.',
  "The title should be in the same language as the user's message.",
  "Try to generate a title that is as close as possible to the user's message.",
  'Title should not be more than 30 characters.',
  'Title should be properly formatted, example: "Update component in React".',
  'Do not use dots, commas, etc.',
  'Generate only the text of the title, nothing else.',
].join('\n')

export const generateChatTitle = async (data: {
  messages: AppUIMessage[]
  signal?: AbortSignal
}) => {
  const prompt = data.messages
    .map((message) => textFromMessage(message))
    .filter(Boolean)
    .join('\n')

  const { text } = await generateText({
    abortSignal: data.signal,
    instructions: TITLE_SYSTEM_PROMPT,
    model: fastModel,
    prompt,
  })

  return text
}
