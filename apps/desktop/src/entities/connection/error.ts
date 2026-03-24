export class ConnectionError extends Error {
  readonly connectionName: string
  readonly resourceName: string

  constructor(cause: unknown, options: { connectionName: string, resourceName: string }) {
    const message = cause instanceof Error ? cause.message : String(cause)
    super(message, { cause })
    this.name = 'ConnectionError'
    this.connectionName = options.connectionName
    this.resourceName = options.resourceName

    if (cause instanceof Error && cause.stack) {
      this.stack = cause.stack
    }
  }
}
