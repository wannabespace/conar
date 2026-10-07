import type { ConnectionType } from './enums/connection-type'

export const MCP_MAX_ROWS = 200

/** `ask` holds each `execute` until the user approves it in Tamery. */
export type McpAccess = 'read' | 'ask' | 'write'

export interface McpConnection {
  id: string
  name: string
  type: ConnectionType
  resources: string[]
}

export interface McpTarget {
  connectionId: string
  resource?: string
}

/** Answered by a signed-in window: connections, their decryption key and the query runtime live in the renderer. Main owns each connection's access: it refuses `execute` on a read-only one before asking and adds `access` to the listed connections. */
export interface McpSource {
  connections: () => McpConnection[]
  describeTable: (
    args: McpTarget & { schema: string; table: string }
  ) => Promise<unknown>
  /** `onAbort` registers the listener the caller fires when the agent goes away; an `AbortSignal` cannot cross the context bridge. */
  query: (
    args: McpTarget & { sql: string; access: McpAccess },
    onAbort: (listener: () => void) => void
  ) => Promise<unknown>
  tables: (args: McpTarget & { schema?: string }) => Promise<unknown>
}

export type McpRequest = {
  [K in keyof McpSource]: { method: K; args: Parameters<McpSource[K]>[0] }
}[keyof McpSource]

export type McpReply = { result: unknown } | { error: string } | { idle: true }

export type McpStatus =
  | { state: 'off' }
  | { state: 'failed'; error: string }
  | { state: 'running'; token: string; url: string }
