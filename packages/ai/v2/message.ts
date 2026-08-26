import type { MessagePart, UIMessage } from '@tanstack/ai'

export type AppUIMessage = UIMessage
export type AppMessagePart = MessagePart

export const isTextPart = (
  part: AppMessagePart
): part is Extract<AppMessagePart, { type: 'text' }> => part.type === 'text'

export const messageText = (message: Pick<AppUIMessage, 'parts'>) =>
  message.parts
    .filter((part) => isTextPart(part))
    .map((part) => part.content)
    .join('\n')
    .trim()

export interface MessagePartRow {
  order: number
  part: AppMessagePart
}

export const messagePartsFromRows = (rows: MessagePartRow[]) =>
  rows.toSorted((a, b) => a.order - b.order).map(({ part }) => part)

export const messageTextFromRows = (rows: MessagePartRow[]) =>
  messageText({ parts: messagePartsFromRows(rows) })
