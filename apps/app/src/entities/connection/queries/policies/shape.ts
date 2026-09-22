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

export interface PolicyTarget {
  name: string
  schema: string
  table: string
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

const EXCEPT_PREFIX = /^EXCEPT\s+/iu

// The list query reads ClickHouse's audience back as "ALL" plus "EXCEPT <role>"
// entries, so the same strings round-trip into TO.
export const clickhouseRoleList = (roles: string[]) => {
  const excepted = roles
    .filter((role) => EXCEPT_PREFIX.test(role))
    .map((role) => sql.id(role.replace(EXCEPT_PREFIX, '')))

  if (excepted.length > 0) {
    return sql`ALL EXCEPT ${sql.join(excepted)}`
  }
  const named = roles
    .filter((role) => role.toUpperCase() !== 'ALL')
    .map((role) => sql.id(role))

  return named.length > 0 ? sql.join(named) : sql`ALL`
}

// User-authored SQL, sent verbatim like a runner query
export const expression = (keyword: string, value: string | null) =>
  value?.trim() ? sql` ${sql.raw(keyword)} (${sql.raw(value.trim())})` : sql``

export const policyOn = ({ name, schema, table }: PolicyTarget) =>
  sql`${sql.id(name)} ON ${sql.id(schema, table)}`

export const createRowPolicyStatement = ({
  schema,
  shape,
  table,
}: {
  schema: string
  shape: PolicyShape
  table: string
}) =>
  sql`
    CREATE ROW POLICY ${policyOn({ name: shape.name, schema, table })}
    FOR SELECT ${expression('USING', shape.using)}
    AS ${sql.raw(shape.kind)} TO ${clickhouseRoleList(shape.roles)}
  `

export const createPolicyStatement = ({
  schema,
  shape,
  table,
}: {
  schema: string
  shape: PolicyShape
  table: string
}) =>
  sql`
    CREATE POLICY ${policyOn({ name: shape.name, schema, table })}
    AS ${sql.raw(shape.kind)} FOR ${sql.raw(shape.command)} TO ${roleList(shape.roles)}
    ${expression('USING', shape.using)}
    ${expression('WITH CHECK', shape.check)}
  `
