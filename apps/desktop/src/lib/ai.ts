import type { UIMessage } from '@ai-sdk/react'
import type { AppUIMessage } from '@conar/api/ai-tools'

export function convertToAppUIMessage(message: UIMessage): AppUIMessage {
  return message as AppUIMessage
}
