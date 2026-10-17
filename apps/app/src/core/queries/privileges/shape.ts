import { sql } from 'kysely'

export const PRIVILEGE_TYPES = [
  'SELECT',
  'INSERT',
  'UPDATE',
  'DELETE',
  'CREATE',
  'ALTER',
  'DROP',
  'INDEX',
  'REFERENCES',
  'TRIGGER',
  'CREATE VIEW',
  'SHOW VIEW',
] as const

export const ALL_TABLES = '*'

const LIKE_TOKEN = /\\(?<literal>.)|[%_]|[^\\%_]+|\\/gsu
const LIKE_WILDCARDS: Record<string, string> = { '%': '.*', _: '.' }

// A database-wide grant names a LIKE pattern (`app\_db`, `app%`), not a
// database, and REVOKE needs that exact pattern back.
export const grantCoversSchema = (pattern: string, schema: string) =>
  new RegExp(
    `^${pattern.replaceAll(LIKE_TOKEN, (token, literal?: string) =>
      literal === undefined
        ? (LIKE_WILDCARDS[token] ?? RegExp.escape(token))
        : RegExp.escape(literal)
    )}$`,
    'su'
  ).test(schema)

export interface PrivilegeTarget {
  grantable?: boolean
  grantee: string
  privilege: string
  schema: string
  table: string
}

const ACCOUNT = /^'?(?<user>[^'@]*)'?(?:@'?(?<host>[^']*)'?)?$/u

export const getAccount = (grantee: string) => {
  const { host, user = grantee } = ACCOUNT.exec(grantee.trim())?.groups ?? {}

  return sql`${sql.lit(user)}@${sql.lit(host || '%')}`
}

export const privilegeOn = ({ privilege, schema, table }: PrivilegeTarget) =>
  sql`${sql.raw(privilege)} ON ${table === ALL_TABLES ? sql`${sql.id(schema)}.*` : sql.id(schema, table)}`
