import type {
  DynamicToolUIPart,
  InferUITools,
  ToolUIPart as ToolUIPartAi,
  UIDataTypes,
  UIMessage,
} from 'ai'
import { isToolUIPart as isToolUIPartAi } from 'ai'

import type { tools } from './tools'

export type UITools = InferUITools<typeof tools>

export type AppUIMessage = UIMessage<
  {
    updatedAt?: Date
    createdAt?: Date
  },
  UIDataTypes,
  UITools
>

export const convertToAppUIMessage = (message: UIMessage): AppUIMessage =>
  message as AppUIMessage

export type ToolUIPart = ToolUIPartAi<UITools> | DynamicToolUIPart

export const isToolUIPart = (
  part: UIMessage['parts'][number]
): part is ToolUIPart => isToolUIPartAi(part)
