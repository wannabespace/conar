import { getDialect, SqlDialect } from '@tamery/shared/enums/connection-type'

import type { ConnectionParts } from '../connection-parts'
import { TLS_PARAMS as MYSQL_TLS_PARAMS } from './mysql'
import { TLS_PARAMS as PG_TLS_PARAMS } from './pg'

export type SslSetting = 'off' | 'on' | 'unverified'

// Sync with the options `ssl/<engine>.ts` parses.
const SSL_OPTIONS: Partial<
  Record<SqlDialect, Partial<Record<SslSetting, string>>>
> = {
  [SqlDialect.MSSQL]: {
    off: 'encrypt=false',
    on: 'encrypt=true',
    unverified: 'trustservercertificate=true',
  },
  [SqlDialect.MySQL]: { off: 'ssl=false', on: 'ssl=true' },
  [SqlDialect.Postgres]: {
    off: 'sslmode=disable',
    on: 'sslmode=require',
    unverified: 'sslmode=no-verify',
  },
}

const TLS_PARAMS: Partial<Record<SqlDialect, string[]>> = {
  [SqlDialect.MySQL]: MYSQL_TLS_PARAMS,
  [SqlDialect.Postgres]: PG_TLS_PARAMS,
}

export const getSslOptions = (
  { options, type }: Pick<ConnectionParts, 'options' | 'type'>,
  setting: SslSetting
) => {
  const dialect = type && getDialect(type)
  const option = dialect ? SSL_OPTIONS[dialect]?.[setting] : undefined
  if (!dialect || !option) {
    return
  }
  const update = new URLSearchParams(option)
  const dropped = new Set([
    ...update.keys(),
    ...(setting === 'off' ? (TLS_PARAMS[dialect] ?? []) : []),
  ])
  const merged = new URLSearchParams(
    [...new URLSearchParams(options)].filter(
      ([key]) => !dropped.has(key.toLowerCase())
    )
  )
  for (const [key, value] of update) {
    merged.append(key, value)
  }
  return merged.toString()
}
