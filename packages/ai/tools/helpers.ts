import type { DynamicToolUIPart, InferUITools, ToolUIPart as ToolUIPartAi, UIDataTypes, UIMessage } from 'ai'
import type { tools } from '.'
import { isToolUIPart as isToolUIPartAi } from 'ai'

export type UITools = InferUITools<typeof tools>

export type AppUIMessage = UIMessage<
  {
    updatedAt?: Date
    createdAt?: Date
  },
  UIDataTypes,
  UITools
>

export function convertToAppUIMessage(message: UIMessage): AppUIMessage {
  return message as AppUIMessage
}

export type ToolUIPart = ToolUIPartAi<UITools> | DynamicToolUIPart

export function isToolUIPart(part: UIMessage['parts'][number]): part is ToolUIPart {
  return isToolUIPartAi(part)
}
