import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { decodeURIComponentOrRaw } from '@tamery/shared/utils'

import type { DatabaseGuess } from './types'

const QUOTED = /^(?<quote>["'])(?<inner>.*)\k<quote>$/su
const URL_PREFIX = /^(?:jdbc:)?(?:sqlite3?|file):(?:\/\/)?/iu
const CLI_PREFIX = /^sqlite3?\s+/iu
const ABSOLUTE_PATH = /^(?:\/|[a-z]:[\\/])[^\n]*$/iu
const SQLITE_EXTENSION = /\.(?:db|db3|sqlite|sqlite3)$/iu

const unquote = (text: string) => text.replace(QUOTED, '$<inner>')

/** A bare path counts only with a SQLite extension; `sqlite3 <file>`, `file:` and `jdbc:sqlite:` name one outright. */
export const guessSqlite = (text: string): DatabaseGuess | null => {
  const trimmed = unquote(text.trim())
  const url = URL_PREFIX.exec(trimmed)?.[0]
  const cli = CLI_PREFIX.exec(trimmed)?.[0]
  const rest = unquote(trimmed.slice((url ?? cli ?? '').length))
  const path = url ? decodeURIComponentOrRaw(rest) : rest
  if (
    !ABSOLUTE_PATH.test(path) ||
    (!url && !cli && !SQLITE_EXTENSION.test(path))
  ) {
    return null
  }
  return {
    format: url ? 'url' : 'path',
    parts: { database: path, type: ConnectionType.SQLite },
  }
}
