import { sql } from 'kysely'

export const POLICY_COMMANDS = [
  'ALL',
  'SELECT',
  'INSERT',
  'UPDATE',
  'DELETE',
] as const

export type PolicyCommand = (typeof POLICY_COMMANDS)[number]
export type PolicyKind = 'PERMISSIVE' | 'RESTRICTIVE'

export interface PolicyShape {
  check: string | null
  command: PolicyCommand
  kind: PolicyKind
  name: string
  roles: string[]
  using: string | null
}

const ROLE_KEYWORDS = new Set([
  'PUBLIC',
  'CURRENT_ROLE',
  'CURRENT_USER',
  'SESSION_USER',
])

export const roleList = (roles: string[]) =>
  roles.length === 0
    ? sql`PUBLIC`
    : sql.join(
        roles.map((role) =>
          ROLE_KEYWORDS.has(role.toUpperCase())
            ? sql.raw(role.toUpperCase())
            : sql.id(role)
        )
      )

// User-authored SQL, sent verbatim like a runner query
export const expression = (keyword: string, value: string | null) =>
  value?.trim() ? sql` ${sql.raw(keyword)} (${sql.raw(value.trim())})` : sql``

export const policyClause = ({
  schema,
  shape,
  table,
}: {
  schema: string
  shape: PolicyShape
  table: string
}) =>
  sql`CREATE POLICY ${sql.id(shape.name)} ON ${sql.id(schema, table)} AS ${sql.raw(shape.kind)} FOR ${sql.raw(shape.command)} TO ${roleList(shape.roles)}${expression('USING', shape.using)}${expression('WITH CHECK', shape.check)}`

export interface PolicyTarget {
  name: string
  schema: string
  table: string
}

export const policyOn = ({ name, schema, table }: PolicyTarget) =>
  sql`${sql.id(name)} ON ${sql.id(schema, table)}`
