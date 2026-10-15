import { ConnectionType } from '@tamery/shared/enums/connection-type'

import {
  CLICKHOUSE_HTTP_PORT_OF_NATIVE,
  connectionParts,
  flavorOfScheme,
  HTTPS_PORT,
  typeOfScheme,
} from '../connection-parts'
import { hostHintOf } from '../hosts'
import { adoPairs, adoParts } from './ado'
import type { DatabaseGuess } from './types'

const URL_PATTERN = /(?:jdbc:)?[a-z][\w+.-]*:\/\/[^\s"'`<>]+/giu
/** Keeps the `]` that closes an IPv6 host (`postgres://[::1]`). */
const TRAILING_PUNCTUATION = /(?<!\[[\da-f:.%]*)[.,;:)\]]+$/iu
const WEB_SCHEME = /^https?:/iu
const SEMICOLON_URL =
  /^(?:sqlserver|mssql):\/\/(?<address>[^;/?]*);(?<props>.*)$/iu

const takeParam = (params: URLSearchParams, keys: string[]) => {
  const value = keys.map((key) => params.get(key)).find(Boolean) ?? ''
  for (const key of keys) {
    params.delete(key)
  }
  return value
}

const guessOfUrl = (candidate: string): DatabaseGuess => {
  const format = candidate.toLowerCase().startsWith('jdbc:') ? 'jdbc' : 'url'
  const url = candidate.replace(/^jdbc:/iu, '')

  const semicolonUrl = SEMICOLON_URL.exec(url)?.groups
  if (semicolonUrl) {
    const pairs = adoPairs(semicolonUrl.props ?? '')
    if (semicolonUrl.address) {
      pairs.set('server', semicolonUrl.address.replace(':', ','))
    }
    return { format, parts: { ...adoParts(pairs), type: ConnectionType.MSSQL } }
  }

  const parts = connectionParts.parse(url)
  const params = new URLSearchParams(parts.options)
  const user = takeParam(params, ['user', 'username'])
  const password = takeParam(params, ['password'])
  const database = takeParam(params, ['database', 'databasename', 'dbname'])

  return {
    format,
    parts: {
      ...parts,
      database: parts.database || database,
      flavor: flavorOfScheme(url),
      options: params.toString(),
      password: parts.password || password,
      port: !parts.port && parts.https ? HTTPS_PORT : parts.port,
      user: parts.user || user,
    },
  }
}

const urlsIn = (text: string) =>
  Array.from(text.matchAll(URL_PATTERN), ([match]) =>
    match.replace(TRAILING_PUNCTUATION, '')
  ).filter((url) => typeOfScheme(url.slice(0, url.indexOf('://'))))

export const guessUrl = (text: string): DatabaseGuess | null => {
  const url = urlsIn(text).find((candidate) => !WEB_SCHEME.test(candidate))
  return url ? guessOfUrl(url) : null
}

const GO_DSN =
  /(?<user>[^\s:@/"'=]*)(?::(?<password>[^\s@"']*))?@tcp\((?<host>[^\s():]+)(?::(?<port>\d+))?\)\/(?<database>[^\s?"']*)/u

export const guessGoDsn = (text: string): DatabaseGuess | null => {
  const groups = GO_DSN.exec(text)?.groups
  return groups
    ? { format: 'url', parts: { ...groups, type: ConnectionType.MySQL } }
    : null
}

const CLICKHOUSE_NAME = /clickhouse/iu
const MULTI_SEGMENT_PATH = /^\/[^/]+\/./u

/** Any page link is http(s) too, so it needs ClickHouse evidence; keep it after the other detectors or any `APP_URL=https://…` wins. */
export const guessWebUrl = (
  text: string,
  context = text
): DatabaseGuess | null => {
  const url = urlsIn(text).find((candidate) => {
    if (!WEB_SCHEME.test(candidate)) {
      return false
    }
    const { hostname, pathname, port } = URL.parse(candidate) ?? {}
    return (
      !MULTI_SEGMENT_PATH.test(pathname ?? '') &&
      (Object.values(CLICKHOUSE_HTTP_PORT_OF_NATIVE).includes(port ?? '') ||
        hostHintOf(hostname ?? '')?.type === ConnectionType.ClickHouse ||
        CLICKHOUSE_NAME.test(context.replace(candidate, '')))
    )
  })
  return url ? guessOfUrl(url) : null
}
