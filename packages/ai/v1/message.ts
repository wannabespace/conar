import type {
  DynamicToolUIPart,
  InferUITools,
  ToolUIPart as ToolUIPartAi,
  UIDataTypes,
  UIMessage,
} from 'ai'
import { isToolUIPart as isToolUIPartAi } from 'ai'

import type { createTools } from './tools'

export type UITools = InferUITools<ReturnType<typeof createTools>>

export type AppUIMessage = UIMessage<
  {
    updatedAt?: Date
    createdAt?: Date
  },
  UIDataTypes,
  UITools
>

export type ToolUIPart = ToolUIPartAi<UITools> | DynamicToolUIPart

export const isToolUIPart = (
  part: UIMessage['parts'][number]
): part is ToolUIPart => isToolUIPartAi(part)
