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

export interface PrivilegeTarget {
  grantable?: boolean
  grantee: string
  privilege: string
  schema: string
  table: string
}

const ACCOUNT = /^'?(?<user>[^'@]*)'?(?:@'?(?<host>[^']*)'?)?$/u

// Takes the catalog's 'user'@'host' as well as a typed user@host or bare user.
export const accountOf = (grantee: string) => {
  const { host, user = grantee } = ACCOUNT.exec(grantee.trim())?.groups ?? {}

  return sql`${sql.lit(user)}@${sql.lit(host || '%')}`
}

export const privilegeOn = ({ privilege, schema, table }: PrivilegeTarget) =>
  sql`${sql.raw(privilege)} ON ${table === ALL_TABLES ? sql`${sql.id(schema)}.*` : sql.id(schema, table)}`
