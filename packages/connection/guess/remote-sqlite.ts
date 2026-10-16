import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { connectionParts } from '../connection-parts'
import { D1_HOST } from '../sqlite-location'
import { guessEnv } from './env'
import type { DatabaseGuess, GuessedParts } from './types'

/** A `libsql://` URL is read by the URL detector; Turso's dashboard also hands out the same database as `https://` or `wss://`. */
const TURSO_URL =
  /\b(?:wss?|https?):\/\/[\w.-]+\.turso\.io(?::\d+)?[^\s"'`<>]*/iu

const D1_LINK =
  /(?:dash\.cloudflare\.com\/|\/client\/v4\/accounts\/)(?<account>[\da-f]{32})\/(?:workers\/)?d1\/databases?\/(?<database>[\da-f-]{36})/iu
const UUID = String.raw`[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}`
/** A bare `database_id` counts only inside a wrangler `d1_databases` entry: plenty of other configs have one. */
const D1_DATABASE_ID = new RegExp(
  String.raw`(?:CLOUDFLARE_(?:D1_)?DATABASE_ID|\bD1_DATABASE_ID)["']?\s*[:=]\s*["']?(?<database>${UUID})`,
  'iu'
)
const WRANGLER_DATABASE_ID = new RegExp(
  String.raw`d1_databases[\s\S]*?\bdatabase_id["']?\s*[:=]\s*["']?(?<database>${UUID})`,
  'iu'
)
const ACCOUNT_ID =
  /(?:CLOUDFLARE_ACCOUNT_ID|\baccount_?id)["']?\s*[:=]\s*["']?(?<account>[\da-f]{32})/iu
const API_TOKEN =
  /(?:CLOUDFLARE_(?:D1_|API_)TOKEN|\bD1_TOKEN|\btoken)["']?\s*[:=]\s*["']?(?<token>[\w-]{40,})/iu

const turso = (text: string): DatabaseGuess | null => {
  const [url] = TURSO_URL.exec(text) ?? []
  if (!url) {
    return null
  }
  const { host, options, password, port } = connectionParts.parse(
    url.replace(/^\w+:/u, 'libsql:')
  )
  const token = password || guessEnv(text)?.parts.password
  return {
    format: 'url',
    parts: {
      host,
      options,
      port,
      type: ConnectionType.SQLite,
      ...(token && { password: token }),
    },
  }
}

const d1 = (text: string): DatabaseGuess | null => {
  const link = D1_LINK.exec(text)?.groups
  const database =
    link?.database ??
    (D1_DATABASE_ID.exec(text) ?? WRANGLER_DATABASE_ID.exec(text))?.groups
      ?.database
  if (!database) {
    return null
  }
  const account = link?.account ?? ACCOUNT_ID.exec(text)?.groups?.account
  const token = API_TOKEN.exec(text)?.groups?.token
  const parts: GuessedParts = {
    database,
    host: D1_HOST,
    type: ConnectionType.SQLite,
    ...(account && { user: account }),
    ...(token && { password: token }),
  }
  return { format: link ? 'url' : 'env', parts }
}

/** Turso hands out its URL and token apart; D1 a dashboard link, a wrangler config or Cloudflare's env names. */
export const guessRemoteSqlite = (text: string): DatabaseGuess | null =>
  turso(text) ?? d1(text)
