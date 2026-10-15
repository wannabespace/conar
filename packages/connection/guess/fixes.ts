import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { DEFAULT_PORTS } from '../connection-parts'
import { hostHintOf } from '../hosts'
import type { GuessFix, GuessedParts } from './types'

const PASSWORD_PLACEHOLDER =
  /^(?:\[[^\]]*\]|<[^>]*>|\{[^}]*\}|\*+|your[-_ ]?password)$/iu
/** Prisma reads these itself; a database driver would pass them on to the server. */
const PRISMA_PARAMS = ['pgbouncer', 'connection_limit', 'pool_timeout']

export const fixParts = ({ options, ...found }: GuessedParts) => {
  const params = new URLSearchParams(options)
  const prismaParams = PRISMA_PARAMS.filter((param) => params.has(param))
  for (const param of prismaParams) {
    params.delete(param)
  }
  const parts: GuessedParts =
    params.size > 0 ? { ...found, options: params.toString() } : found
  const fixes: GuessFix[] = prismaParams.length > 0 ? ['prisma-options'] : []
  const host = parts.host ?? ''
  const hint = hostHintOf(host)
  if (parts.port && hint?.transactionPoolerPort === parts.port) {
    parts.port = String(DEFAULT_PORTS[ConnectionType.Postgres])
    fixes.push('pooler-port')
  }
  const directHost = hint?.directHostOf?.(host) ?? host
  if (directHost !== host) {
    parts.host = directHost
    fixes.push('neon-direct')
  }
  if (PASSWORD_PLACEHOLDER.test(parts.password ?? '')) {
    delete parts.password
  }
  return { fixes, parts }
}
