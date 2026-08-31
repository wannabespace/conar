import { generateText } from 'ai'

import type { AppUIMessage } from './message'
import { messageText } from './message'
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
  // Flattened to a single prompt on purpose: the transcript ends on an
  // assistant turn, and Anthropic treats a trailing assistant message as a
  // prefill to continue — it stops immediately and returns an empty title.
  const prompt = data.messages
    .map((message) => messageText(message))
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
