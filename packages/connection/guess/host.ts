import { isLocalHost } from '../hosts'
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
    (host.includes('.') && !FILE_NAME.test(host)) ||
    isLocalHost(host)
  return looksLikeHost
    ? { format: 'host', parts: { database, host, password, port, user } }
    : null
}
