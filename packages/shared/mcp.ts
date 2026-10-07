import type { ConnectionType } from './enums/connection-type'

export const MCP_MAX_ROWS = 200

export interface McpConnection {
  id: string
  name: string
  type: ConnectionType
  databases: string[]
}

/** Answered by a signed-in window: connections, their decryption key and the query runtime live in the renderer. */
export interface McpSource {
  connections: () => McpConnection[]
  /** `onAbort` registers the listener the caller fires when the agent goes away; an `AbortSignal` cannot cross the context bridge. */
  query: (
    args: { connectionId: string; database?: string; sql: string },
    onAbort: (listener: () => void) => void
  ) => Promise<unknown>
}

export type McpRequest = {
  [K in keyof McpSource]: { method: K; args: Parameters<McpSource[K]>[0] }
}[keyof McpSource]

export type McpReply = { result: unknown } | { error: string } | { idle: true }

export type McpStatus =
  | { state: 'off' }
  | { state: 'failed'; error: string }
  | { state: 'running'; token: string; url: string }
