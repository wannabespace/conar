import type { ConnectionType } from './enums/connection-type'

export interface McpConnection {
  id: string
  name: string
  type: ConnectionType
  databases: string[]
}

export interface McpTarget {
  connectionString: string
  type: ConnectionType
}

/** Answered by a signed-in window: connections and their decryption key live in the renderer. */
export interface McpSource {
  connections: () => McpConnection[]
  target: (args: {
    connectionId: string
    database?: string
  }) => Promise<McpTarget>
}

export interface McpStatus {
  enabled: boolean
  error: string | null
  token: string
  url: string
}
