import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { decodeURIComponentOrRaw } from '@tamery/shared/utils'

import type { DatabaseGuess } from './types'

const QUOTED = /^(?<quote>["'])(?<inner>.*)\k<quote>$/su
const URI_PARAMS = /\?.*$/su
const LEADING_SLASHES = /^\/{2,}/u
const ABSOLUTE_PATH = /^(?:\/|~\/|[a-z]:[\\/])[^\n]*$/iu

const FILE_ENGINES = [
  {
    cliPrefix: /^duckdb\s+/iu,
    extension: /\.(?:duckdb|ddb)$/iu,
    type: ConnectionType.DuckDB,
    urlPrefix: /^(?:jdbc:)?duckdb:(?:\/\/)?/iu,
  },
  {
    cliPrefix: /^sqlite3?\s+/iu,
    extension: /\.(?:db|db3|sqlite|sqlite3)$/iu,
    type: ConnectionType.SQLite,
    urlPrefix: /^(?:jdbc:sqlite:(?:file:)?|(?:sqlite3?|file):)(?:\/\/)?/iu,
  },
] as const

const unquote = (text: string) => text.replace(QUOTED, '$<inner>')

/** A bare path counts only with its engine's extension; the engine's CLI, its URL and `file:` name one outright. */
export const guessDatabaseFile = (text: string): DatabaseGuess | null => {
  const trimmed = unquote(text.trim())
  for (const { cliPrefix, extension, type, urlPrefix } of FILE_ENGINES) {
    const url = urlPrefix.exec(trimmed)?.[0]
    const cli = cliPrefix.exec(trimmed)?.[0]
    const rest = unquote(trimmed.slice((url ?? cli ?? '').length))
    const path = (
      url ? decodeURIComponentOrRaw(rest.replace(URI_PARAMS, '')) : rest
    ).replace(LEADING_SLASHES, '/')
    if (ABSOLUTE_PATH.test(path) && (url || cli || extension.test(path))) {
      return { format: url ? 'url' : 'path', parts: { database: path, type } }
    }
  }
  return null
}
