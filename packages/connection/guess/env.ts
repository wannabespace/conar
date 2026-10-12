import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { typeOfScheme } from '../connection-parts'
import type { DatabaseGuess, GuessedParts } from './types'

type Field = 'database' | 'host' | 'password' | 'port' | 'user'

interface VariableGroup {
  /** Only these fields are read under the prefix: `MYSQL_ROOT_HOST` is an allow-list, not a host. */
  fields?: Field[]
  prefix: string
  type?: ConnectionType
  /** Implied user when the group supplies the password and nothing else named one. */
  user?: string
}

const SUFFIXES_OF_FIELD: Record<Field, string[]> = {
  database: ['DATABASE', 'DBNAME', 'DB', 'NAME'],
  host: ['HOST', 'HOSTNAME', 'SERVER'],
  password: ['PASSWORD', 'PASS', 'PWD'],
  port: ['PORT'],
  user: ['USER', 'USERNAME'],
}
const FIELDS = ['database', 'host', 'password', 'port', 'user'] as const
const TYPE_SUFFIXES = [
  'CONNECTION',
  'PROVIDER',
  'TYPE',
  'DRIVER',
  'DIALECT',
  'ENGINE',
  'CLIENT',
  'ADAPTER',
]
const TYPE_OF_DRIVER: Record<string, ConnectionType> = {
  pgsql: ConnectionType.Postgres,
  sqlsrv: ConnectionType.MSSQL,
  tedious: ConnectionType.MSSQL,
  trilogy: ConnectionType.MySQL,
}
const UNPACKED_TEMPLATE = /\$\{|<%/u
/** `DB_NAME` names a database; a bare `name` (package.json, a connection's label) does not. */
const BARE_NAME = 'NAME'

const GROUPS: VariableGroup[] = [
  { prefix: 'PG', type: ConnectionType.Postgres },
  { prefix: 'POSTGRES_', type: ConnectionType.Postgres },
  { prefix: 'MYSQL_', type: ConnectionType.MySQL },
  { prefix: 'MARIADB_', type: ConnectionType.MySQL },
  {
    fields: ['password'],
    prefix: 'MYSQL_ROOT_',
    type: ConnectionType.MySQL,
    user: 'root',
  },
  { prefix: 'CLICKHOUSE_', type: ConnectionType.ClickHouse },
  { prefix: 'MSSQL_', type: ConnectionType.MSSQL },
  {
    fields: ['password'],
    prefix: 'MSSQL_SA_',
    type: ConnectionType.MSSQL,
    user: 'sa',
  },
  {
    fields: ['password'],
    prefix: 'SA_',
    type: ConnectionType.MSSQL,
    user: 'sa',
  },
  { prefix: 'DB_' },
  { prefix: 'DATABASE_' },
  { prefix: '' },
]

const LINE =
  /^\s*(?:-\s+)?(?:export\s+)?(?<key>[\w.-]+)\s*(?:=|:(?=\s|$))\s*(?<value>.*)$/u
const QUOTED = /^(?<quote>["'`])(?<inner>.*)\k<quote>/u
const UNQUOTED_TAIL = /\s+#.*$|,$/u

/** Keys must be uppercase. */
export const partsOfVariables = (
  variables: Record<string, string>
): GuessedParts | null => {
  const valueOf = (keys: string[]) =>
    keys
      .map((key) => variables[key])
      .find((value) => value && !UNPACKED_TEMPLATE.test(value)) ?? ''
  const parts: GuessedParts = {}

  for (const group of GROUPS) {
    const found = Object.fromEntries(
      (group.fields ?? FIELDS).map((field) => [
        field,
        valueOf(
          SUFFIXES_OF_FIELD[field]
            .filter((suffix) => group.prefix || suffix !== BARE_NAME)
            .map((suffix) => group.prefix + suffix)
        ),
      ])
    )
    const type =
      group.type ??
      TYPE_SUFFIXES.map((suffix) => variables[group.prefix + suffix])
        .filter((value): value is string => !!value)
        .map((name) => TYPE_OF_DRIVER[name.toLowerCase()] ?? typeOfScheme(name))
        .find(Boolean)
    if (
      !Object.values(found).some(Boolean) ||
      (!group.prefix && !type && !found.database && !found.password)
    ) {
      continue
    }
    if (!group.user) {
      for (const field of FIELDS) {
        parts[field] ||= found[field]
      }
    } else if (!parts.user && !parts.password) {
      parts.user = group.user
      parts.password = found.password
    }
    parts.type ??= type
  }

  return FIELDS.some((field) => parts[field]) ? parts : null
}

export const guessEnv = (text: string): DatabaseGuess | null => {
  const variables: Record<string, string> = {}
  for (const line of text.split('\n')) {
    const { key, value = '' } = LINE.exec(line)?.groups ?? {}
    if (key) {
      variables[key.toUpperCase()] ??=
        QUOTED.exec(value.trim())?.groups?.inner ??
        value.replace(UNQUOTED_TAIL, '').trim()
    }
  }
  const parts = partsOfVariables(variables)
  return parts && { format: 'env', parts }
}
