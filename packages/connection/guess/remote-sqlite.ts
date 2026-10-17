import { ConnectionType, Provider } from '@tamery/shared/enums/connection-type'
import { type } from 'arktype'

import { D1_HOST } from '../connection-parts'
import { variablesOfLines } from './env'
import type { DatabaseGuess, GuessedParts } from './types'
import { guessUrl, parsedUrlsIn } from './url'

const TURSO_DOMAIN = '.turso.io'
const D1_DASHBOARD_HOST = 'dash.cloudflare.com'

const accountId = type('string.hex == 32')
const databaseId = type('string.uuid')
const apiToken = type(/^[\w-]{40,}$/u)

const ACCOUNT_ID_KEYS = ['CLOUDFLARE_ACCOUNT_ID', 'ACCOUNT_ID', 'ACCOUNTID']
const DATABASE_ID_KEYS = [
  'CLOUDFLARE_DATABASE_ID',
  'CLOUDFLARE_D1_DATABASE_ID',
  'D1_DATABASE_ID',
]
const API_TOKEN_KEYS = [
  'CLOUDFLARE_D1_TOKEN',
  'CLOUDFLARE_API_TOKEN',
  'D1_TOKEN',
  'TOKEN',
]
/** A bare `database_id` counts only inside a wrangler `d1_databases` entry: plenty of other configs have one. */
const WRANGLER_D1 = /d1_databases/iu

/** A `libsql://` URL is read by the URL detector; Turso's dashboard also hands out the same database as `https://` or `wss://`. */
const turso = (text: string): DatabaseGuess | null => {
  const url = parsedUrlsIn(text).find(({ hostname }) =>
    hostname.endsWith(TURSO_DOMAIN)
  )
  return url ? guessUrl(url.href.replace(/^\w+:/u, 'libsql:')) : null
}

const d1Link = (text: string) =>
  parsedUrlsIn(text)
    .filter(
      ({ hostname, pathname }) =>
        (hostname === D1_DASHBOARD_HOST || hostname === D1_HOST) &&
        pathname.split('/').includes('d1')
    )
    .map(({ pathname }) => {
      const segments = pathname.split('/')
      return {
        account: segments.find((segment) => accountId.allows(segment)),
        database: segments.find((segment) => databaseId.allows(segment)),
      }
    })
    .find(({ database }) => database)

const d1 = (text: string): DatabaseGuess | null => {
  const variables = variablesOfLines(text.split('\n'))
  const valueOf = (keys: string[], valid: (value: string) => boolean) =>
    keys.map((key) => variables[key]).find((value) => value && valid(value))
  const link = d1Link(text)
  const database =
    link?.database ??
    valueOf(
      WRANGLER_D1.test(text)
        ? [...DATABASE_ID_KEYS, 'DATABASE_ID']
        : DATABASE_ID_KEYS,
      databaseId.allows
    )
  if (!database) {
    return null
  }
  const account = link?.account ?? valueOf(ACCOUNT_ID_KEYS, accountId.allows)
  const token = valueOf(API_TOKEN_KEYS, apiToken.allows)
  const parts: GuessedParts = {
    database,
    host: D1_HOST,
    provider: Provider.CloudflareD1,
    type: ConnectionType.SQLite,
    ...(account && { user: account }),
    ...(token && { password: token }),
  }
  return { format: link ? 'url' : 'env', parts }
}

/** Turso hands out its URL and token apart; D1 a dashboard link, a wrangler config or Cloudflare's env names. */
export const guessRemoteSqlite = (text: string): DatabaseGuess | null =>
  turso(text) ?? d1(text)
