import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { DEFAULT_PORTS } from '../connection-parts'
import { hostHintOf } from '../hosts'
import type { GuessedParts } from './types'

export type GuessFix = 'neon-direct' | 'password-placeholder' | 'session-pooler'

const PASSWORD_PLACEHOLDER =
  /^(?:\[[^\]]*\]|<[^>]*>|\{[^}]*\}|\*+|your[-_ ]?password)$/iu
/** Prisma reads these itself; a database driver would pass them on to the server. */
const PRISMA_PARAMS = ['pgbouncer', 'connection_limit', 'pool_timeout']

interface Fix {
  applies: (parts: GuessedParts) => boolean
  apply: (parts: GuessedParts) => GuessedParts
  fix: GuessFix
}

const directHostOf = (host: string) =>
  hostHintOf(host)?.directHostOf?.(host) ?? host

/** Strings providers hand out that connect but break a database client. */
const FIXES: Fix[] = [
  {
    applies: ({ host = '', port }) =>
      !!port && hostHintOf(host)?.transactionPoolerPort === port,
    apply: (parts) => ({
      ...parts,
      port: String(DEFAULT_PORTS[ConnectionType.Postgres]),
    }),
    fix: 'session-pooler',
  },
  {
    applies: ({ host = '' }) => directHostOf(host) !== host,
    apply: (parts) => ({ ...parts, host: directHostOf(parts.host ?? '') }),
    fix: 'neon-direct',
  },
  {
    applies: ({ password = '' }) => PASSWORD_PLACEHOLDER.test(password),
    apply: ({ password: _placeholder, ...parts }) => parts,
    fix: 'password-placeholder',
  },
]

export const fixParts = ({ options, ...found }: GuessedParts) => {
  const params = new URLSearchParams(options)
  for (const param of PRISMA_PARAMS) {
    params.delete(param)
  }
  let parts: GuessedParts =
    params.size > 0 ? { ...found, options: params.toString() } : found
  const fixes: GuessFix[] = []
  for (const { applies, apply, fix } of FIXES) {
    if (applies(parts)) {
      parts = apply(parts)
      fixes.push(fix)
    }
  }
  return { fixes, parts }
}
