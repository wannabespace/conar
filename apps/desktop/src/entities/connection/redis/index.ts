export function executeRedisCommand({
  connectionString,
  command,
  args = [],
  silent = false,
}: {
  connectionString: string
  command: string
  args?: string[]
  silent?: boolean
}) {
  if (!window.electron) {
    throw new Error('Electron is not available')
  }

  return window.electron.redis.command({ connectionString, command, args, silent })
}
