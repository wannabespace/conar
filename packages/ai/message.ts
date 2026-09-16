import type { UIMessage } from 'ai'
import { isTextUIPart } from 'ai'

export interface AppMessageMetadata {
  stopped?: boolean
}

export type AppUIMessage = UIMessage<AppMessageMetadata>
export type AppMessagePart = AppUIMessage['parts'][number]

export const textFromMessage = (message: Pick<AppUIMessage, 'parts'>) =>
  message.parts
    .filter((part) => isTextUIPart(part))
    .map((part) => part.text)
    .join('\n')
    .trim()

interface MessagePartRow {
  order: number
  part: AppMessagePart
  messageId: string
  metadata: AppMessageMetadata | null
  role: AppUIMessage['role']
}

export const messagesFromPartRows = (rows: MessagePartRow[]): AppUIMessage[] =>
  Object.values(Object.groupBy(rows, (row) => row.messageId)).flatMap(
    (group) => {
      const first = group?.[0]
      if (!(first && group)) {
        return []
      }
      return {
        id: first.messageId,
        metadata: first.metadata ?? undefined,
        parts: group
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
