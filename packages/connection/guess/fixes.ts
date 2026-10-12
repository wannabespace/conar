import type { GuessedParts } from './types'

export type GuessFix = 'neon-direct' | 'password-placeholder' | 'session-pooler'

const TRANSACTION_POOLER_PORT = '6543'
const SESSION_PORT = '5432'
const SUPABASE_HOST = /\.supabase\.(?:co|com)$/iu
const NEON_POOLER = /-pooler(?=\.[^.]+.*\.neon\.tech$)/iu
const PASSWORD_PLACEHOLDER =
  /^(?:\[[^\]]*\]|<[^>]*>|\{[^}]*\}|\*+|your[-_ ]?password)$/iu
/** Prisma reads these itself; a database driver would pass them on to the server. */
const PRISMA_PARAMS = ['pgbouncer', 'connection_limit', 'pool_timeout']

interface Fix {
  applies: (parts: GuessedParts) => boolean
  apply: (parts: GuessedParts) => GuessedParts
  fix: GuessFix
}

/** Strings providers hand out that connect but break a database client: a transaction pooler drops session state (open transactions, `SET`, prepared statements) between queries. */
const FIXES: Fix[] = [
  {
    applies: ({ host = '', port }) =>
      SUPABASE_HOST.test(host) && port === TRANSACTION_POOLER_PORT,
    apply: (parts) => ({ ...parts, port: SESSION_PORT }),
    fix: 'session-pooler',
  },
  {
    applies: ({ host = '' }) => NEON_POOLER.test(host),
    apply: (parts) => ({
      ...parts,
      host: parts.host?.replace(NEON_POOLER, ''),
    }),
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

const SUPABASE_DIRECT_HOST = /^db\.[^.]+\.supabase\.co$/iu

/** Supabase's direct host resolves to IPv6 only, so it fails on IPv4 networks. */
export const isIpv6OnlyHost = (host: string) => SUPABASE_DIRECT_HOST.test(host)
