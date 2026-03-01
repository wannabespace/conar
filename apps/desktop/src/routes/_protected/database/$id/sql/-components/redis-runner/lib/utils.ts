import { COMMAND_MESSAGES } from './constants'

export function getCommandMessage(command: string, result: unknown, args: string[] = []): string {
  const fn = COMMAND_MESSAGES[command.toUpperCase()]
  return fn ? fn(result, args) : 'Done'
}

export function parseCommand(raw: string): { cmd: string, args: string[] } | null {
  const parts = raw.trim().split(/\s+/)
  if (!parts.length || !parts[0])
    return null
  const [cmd, ...args] = parts
  return { cmd: cmd!, args }
}
