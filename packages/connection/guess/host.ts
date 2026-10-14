import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { IPV4, isLocalHost } from '../hosts'
import type { DatabaseGuess } from './types'

const BARE_HOST =
  /^(?:(?<user>[^@\s:/]+)(?::(?<password>[^@\s/]*))?@)?(?<host>[\w-]+(?:\.[\w-]+)*)(?::(?<port>\d+))?(?:\/(?<database>[\w.-]+))?$/u

const FILE_NAME =
  /\.(?:conf|csv|env|ini|js|json|key|log|md|pem|pub|py|sql|toml|ts|txt|ya?ml)$/iu

export const guessHost = (text: string): DatabaseGuess | null => {
  const {
    database = '',
    host = '',
    password = '',
    port = '',
    user = '',
  } = BARE_HOST.exec(text.trim())?.groups ?? {}
  const looksLikeHost =
    port ||
    user ||
    (host.includes('.') &&
      !FILE_NAME.test(host) &&
      (IPV4.test(host) || /[a-z]/iu.test(host.split('.').at(-1) ?? ''))) ||
    isLocalHost(host)
  return looksLikeHost
    ? { format: 'host', parts: { database, host, password, port, user } }
    : null
}

const PGPASS =
  /^(?<host>[^:\s]+):(?<port>\d+|\*):(?<database>[^:\s]+):(?<user>[^:\s]+):(?<password>\S+)$/u

export const guessPgpass = (text: string): DatabaseGuess | null => {
  const groups = PGPASS.exec(text.trim())?.groups
  if (!groups) {
    return null
  }
  const parts = Object.fromEntries(
    Object.entries(groups).filter(([, value]) => value !== '*')
  )
  return { format: 'host', parts: { ...parts, type: ConnectionType.Postgres } }
}
