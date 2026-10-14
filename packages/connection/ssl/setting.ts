import { ConnectionType } from '@tamery/shared/enums/connection-type'

import type { ConnectionParts } from '../connection-parts'
import { TLS_PARAMS as MYSQL_TLS_PARAMS } from './mysql'
import { TLS_PARAMS as PG_TLS_PARAMS } from './pg'

export type SslSetting = 'off' | 'on' | 'unverified'

// Sync with the options `ssl/<engine>.ts` parses.
const SSL_OPTIONS: Partial<
  Record<ConnectionType, Partial<Record<SslSetting, string>>>
> = {
  [ConnectionType.MSSQL]: {
    off: 'encrypt=false',
    on: 'encrypt=true',
    unverified: 'trustservercertificate=true',
  },
  [ConnectionType.MySQL]: { off: 'ssl=false', on: 'ssl=true' },
  [ConnectionType.Postgres]: {
    off: 'sslmode=disable',
    on: 'sslmode=require',
    unverified: 'sslmode=no-verify',
  },
}

// The drivers refuse SSL off beside any of these.
const TLS_PARAMS: Partial<Record<ConnectionType, string[]>> = {
  [ConnectionType.MySQL]: MYSQL_TLS_PARAMS,
  [ConnectionType.Postgres]: PG_TLS_PARAMS,
}

export const sslOptionsOf = (
  { options, type }: Pick<ConnectionParts, 'options' | 'type'>,
  setting: SslSetting
) => {
  const option = type ? SSL_OPTIONS[type]?.[setting] : undefined
  if (!type || !option) {
    return
  }
  const update = new URLSearchParams(option)
  // Keys compare lowercase: a paste may say `TrustServerCertificate`, the drivers read lowercase.
  const dropped = new Set([
    ...update.keys(),
    ...(setting === 'off' ? (TLS_PARAMS[type] ?? []) : []),
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
