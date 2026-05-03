export interface QueryExecuteResult {
  result: unknown
  duration: number
}

export interface QueryExecutor {
  execute: (args: {
    connectionString: string
    query: string
    values?: unknown[]
  }) => Promise<QueryExecuteResult>
  beginTransaction: (args: { connectionString: string }) => Promise<{ txId: string }>
  executeTransaction: (args: { txId: string, query: string, values: unknown[] }) => Promise<QueryExecuteResult>
  commitTransaction: (args: { txId: string }) => Promise<void>
  rollbackTransaction: (args: { txId: string }) => Promise<void>
}
