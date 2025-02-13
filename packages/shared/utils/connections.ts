export function parseConnectionString(connectionString: string) {
  // Simplified pattern that matches both with and without protocol
  const pattern = /^(?:(?<protocol>[^:]+):\/\/)?(?<username>[^:]+):(?<password>[^@]+)@(?<host>[^:]+):(?<port>\d+)\/(?<database>[^?]+)(\?(?<options>.+))?$/

  const match = connectionString.match(pattern)

  if (!match || !match.groups) {
    throw new Error('Invalid connection string format')
  }

  return {
    username: match.groups.username,
    password: match.groups.password,
    host: match.groups.host,
    port: Number.parseInt(match.groups.port),
    database: match.groups.database,
    options: match.groups.options || null,
  }
}
