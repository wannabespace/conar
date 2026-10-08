import type { ConnectionType } from './enums/connection-type'
import type { SyncType } from './enums/sync-type'

export const MCP_MAX_ROWS = 200

/** `off` hides the connection from agents; `ask` holds each `execute` until the user approves it in Tamery. */
export type McpAccess = 'off' | 'read' | 'ask' | 'write'

export const DEFAULT_MCP_ACCESS: McpAccess = 'ask'

/** Agent `query` and `execute` runs this device counted toward the free plan's weekly limit. */
export interface McpUsage {
  count: number
  resetsAt: number
}

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

/** Answered by a signed-in window: connections, their decryption key and the query runtime live in the renderer. Main owns each connection's access and refuses a call it does not allow before asking, so the window runs whatever it is asked. */
export interface McpSource {
  connections: () => McpConnection[]
  createConnection: (args: {
    connectionString: string
    name: string
    syncType: SyncType
    type: ConnectionType
  }) => Promise<McpConnection>
  describeTable: (
    args: McpTarget & { schema: string; table: string }
  ) => Promise<unknown>
  /** `approve`: hold the statement until the user approves it. `onAbort` as in `query`. */
  execute: (
    args: McpTarget & { sql: string; approve: boolean },
    onAbort: (listener: () => void) => void
  ) => Promise<unknown>
  /** `onAbort` registers the listener the caller fires when the agent goes away; an `AbortSignal` cannot cross the context bridge. */
  query: (
    args: McpTarget & { sql: string },
    onAbort: (listener: () => void) => void
  ) => Promise<unknown>
  tables: (args: McpTarget & { schema?: string }) => Promise<unknown>
}

export type McpRequest = {
  [K in keyof McpSource]: { method: K; args: Parameters<McpSource[K]>[0] }
}[keyof McpSource]

export type McpReply = { result: unknown } | { error: string } | { idle: true }

export interface McpClient {
  lastSeenAt: number
  name: string
  version: string
}

export type McpStatus =
  | { state: 'off' }
  | { state: 'failed'; error: string }
  | { state: 'running'; token: string; url: string }
