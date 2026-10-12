import { isLocalHost } from './hosts'
import type { DatabaseGuess } from './types'

const BARE_HOST =
  /^(?:(?<user>[^@\s:/]+)(?::(?<password>[^@\s]*))?@)?(?<host>[\w-]+(?:\.[\w-]+)*)(?::(?<port>\d+))?(?:\/(?<database>[\w.-]+))?$/u

export const guessHost = (text: string): DatabaseGuess | null => {
  const {
    database = '',
    host = '',
    password = '',
    port = '',
    user = '',
  } = BARE_HOST.exec(text.trim())?.groups ?? {}
  const looksLikeHost = port || user || host.includes('.') || isLocalHost(host)
  return looksLikeHost
    ? { format: 'host', parts: { database, host, password, port, user } }
    : null
}
