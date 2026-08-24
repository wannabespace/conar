import type { MessagePart, UIMessage } from '@tanstack/ai'

export type AppUIMessage = UIMessage
export type AppMessagePart = MessagePart

export const isTextPart = (
  part: AppMessagePart
): part is Extract<AppMessagePart, { type: 'text' }> => part.type === 'text'

export const messageText = (message: AppUIMessage) =>
  message.parts
    .filter((part) => isTextPart(part))
    .map((part) => part.content)
    .join('\n')
    .trim()
