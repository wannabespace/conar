import { parse } from 'shell-quote'

export const shellCommands = (line: string): string[][] => {
  const commands: string[][] = [[]]
  for (const entry of parse(line, (name) => `$${name}`)) {
    if (typeof entry === 'string') {
      commands.at(-1)?.push(entry)
    } else if ('pattern' in entry) {
      commands.at(-1)?.push(entry.pattern)
    } else if ('comment' in entry) {
      break
    } else {
      commands.push([])
    }
  }
  return commands
}
