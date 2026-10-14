import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { shellCommands } from './tokens'
import type { DatabaseGuess, GuessedParts, ServerField } from './types'

const PAIR = /^(?<key>[a-z_]+)=(?<value>.*)$/su
const FIELD_OF_KEY: Record<string, ServerField> = {
  dbname: 'database',
  host: 'host',
  hostaddr: 'host',
  password: 'password',
  port: 'port',
  user: 'user',
}

export const guessKeyValue = (text: string): DatabaseGuess | null => {
  const parts: GuessedParts = { type: ConnectionType.Postgres }
  const options = new URLSearchParams()
  for (const token of shellCommands(text)[0] ?? []) {
    const { key, value = '' } = PAIR.exec(token)?.groups ?? {}
    if (!key) {
      return null
    }
    const field = FIELD_OF_KEY[key]
    if (field) {
      parts[field] = value
    } else {
      options.append(key, value)
    }
  }
  if (!parts.host && !parts.database) {
    return null
  }
  return {
    format: 'key-value',
    parts: { ...parts, options: options.toString() },
  }
}
