import type { UIMessage } from 'ai'
import { isTextUIPart } from 'ai'

export type AppUIMessage = UIMessage<Record<string, unknown>>
export type AppMessagePart = AppUIMessage['parts'][number]

export const textFromMessage = (message: Pick<AppUIMessage, 'parts'>) =>
  message.parts
    .filter((part) => isTextUIPart(part))
    .map((part) => part.text)
    .join('\n')
    .trim()

interface MessageRow {
  order: number
  part: AppMessagePart
  messageId: string
  metadata: Record<string, unknown> | null
  role: AppUIMessage['role']
}

export const messagesFromRows = (rows: MessageRow[]): AppUIMessage[] =>
  Object.values(Object.groupBy(rows, (row) => row.messageId)).flatMap(
    (group) => {
      const parts = group ?? []
      const [first] = parts
      if (!first) {
        return []
      }
      return {
        id: first.messageId,
        metadata: first.metadata ?? undefined,
        parts: parts
          .toSorted((a, b) => a.order - b.order)
          .map(({ part }) => part),
        role: first.role,
      }
    }
  )

export const mergeMessages = (
  persisted: AppUIMessage[],
  live: AppUIMessage[]
): AppUIMessage[] => {
  const persistedIds = new Set(persisted.map((message) => message.id))
  return [
    ...persisted,
    ...live.filter((message) => !persistedIds.has(message.id)),
  ]
}
