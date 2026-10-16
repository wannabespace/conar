import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { D1_HOST } from '../sqlite-remote'
import type { DatabaseGuess, GuessedParts } from './types'

const LIBSQL_URL =
  /\b(?:libsql|wss?|https?):\/\/(?<host>[\w.-]+)(?::(?<port>\d+))?[^\s"'`<>]*/giu
const TURSO_HOST = /\.turso\.io$/iu
const AUTH_TOKEN =
  /(?:authToken=|(?:TURSO|LIBSQL|DATABASE)_AUTH_TOKEN["']?\s*[:=]\s*|\bauthToken["']?\s*[:=]\s*)["']?(?<token>[\w.-]{20,})/iu

const D1_LINK =
  /(?:dash\.cloudflare\.com\/|\/client\/v4\/accounts\/)(?<account>[\da-f]{32})\/(?:workers\/)?d1\/databases?\/(?<database>[\da-f-]{36})/iu
const ACCOUNT_ID =
  /(?:CLOUDFLARE_ACCOUNT_ID|\baccount_?id)["']?\s*[:=]\s*["']?(?<account>[\da-f]{32})/iu
const DATABASE_ID =
  /(?:CLOUDFLARE_(?:D1_)?DATABASE_ID|\bD1_DATABASE_ID|\bdatabase_?id)["']?\s*[:=]\s*["']?(?<database>[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12})/iu
const API_TOKEN =
  /(?:CLOUDFLARE_(?:D1_|API_)TOKEN|\bD1_TOKEN|\btoken)["']?\s*[:=]\s*["']?(?<token>[\w-]{40,})/iu

const turso = (text: string): DatabaseGuess | null => {
  const found = [...text.matchAll(LIBSQL_URL)].find(
    (match) =>
      match[0].toLowerCase().startsWith('libsql:') ||
      TURSO_HOST.test(match.groups?.host ?? '')
  )
  if (!found?.groups?.host) {
    return null
  }
  const token = AUTH_TOKEN.exec(text)?.groups?.token
  return {
    format: 'url',
    parts: {
      host: found.groups.host,
      port: found.groups.port ?? '',
      type: ConnectionType.SQLite,
      ...(token && { password: token }),
    },
  }
}

const d1 = (text: string): DatabaseGuess | null => {
  const link = D1_LINK.exec(text)?.groups
  const account = link?.account ?? ACCOUNT_ID.exec(text)?.groups?.account
  const database = link?.database ?? DATABASE_ID.exec(text)?.groups?.database
  if (!database) {
    return null
  }
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

/** Turso hands out a `libsql://` URL and a token apart; D1 a dashboard link, a wrangler config or drizzle's three IDs. */
export const guessRemoteSqlite = (text: string): DatabaseGuess | null =>
  turso(text) ?? d1(text)
