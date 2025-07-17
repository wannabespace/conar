import type { InferUITools, ToolCallUnion, ToolResultUnion } from 'ai'
import { tool } from 'ai'
import * as z from 'zod'
import { columnSchema } from './sql/columns'
import { enumSchema } from './sql/enums'

export const tools = {
  columns: tool({
    description: 'Use this tool to get the schema of columns in a table',
    inputSchema: z.object({
      tableName: z.string(),
      schemaName: z.string(),
    }),
    outputSchema: z.array(columnSchema),
  }),
  enums: tool({
    description: 'Use this tool to get the schema of enums in a database',
    inputSchema: z.object({}),
    outputSchema: z.array(enumSchema),
  }),
}

export type ToolCall = ToolCallUnion<typeof tools>
export type ToolResult = ToolResultUnion<typeof tools>
export type UITools = InferUITools<typeof tools>
