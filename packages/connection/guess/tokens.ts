import { parse } from 'shell-quote'

/** Words of one shell command, cut at the first control operator or comment. */
export const shellTokens = (command: string): string[] => {
  const tokens: string[] = []
  for (const entry of parse(command, (name) => `$${name}`)) {
    if (typeof entry === 'string') {
      tokens.push(entry)
    } else if ('pattern' in entry) {
      tokens.push(entry.pattern)
    } else {
      break
    }
  }
  return tokens
}
