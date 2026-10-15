import {
  ConnectionFlavor,
  ConnectionType,
} from '@tamery/shared/enums/connection-type'
import { objectEntries } from '@tamery/shared/utils'

import {
  DEFAULT_PORTS,
  flavorOfScheme,
  typeOfScheme,
} from '../connection-parts'
import { mergeParts } from './parts'
import type { DatabaseGuess, GuessedParts, ServerField } from './types'

interface VariableGroup {
  /** Only these fields are read under the prefix: `MYSQL_ROOT_HOST` is an allow-list, not a host. */
  fields?: ServerField[]
  flavor?: ConnectionFlavor
  prefix: string
  type?: ConnectionType
  /** Implied user when the group supplies the password and nothing else named one. */
  user?: string
}

const SUFFIXES_OF_FIELD: Record<ServerField, string[]> = {
  database: ['DATABASE', 'DBNAME', 'DB', 'NAME'],
  host: ['HOST', 'HOSTNAME', 'SERVER', 'ENDPOINT', 'ADDRESS'],
  password: ['PASSWORD', 'PASS', 'PWD'],
  port: ['PORT'],
  user: ['USER', 'USERNAME'],
}
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
const HOST_AND_PORT = /^(?<host>[^:\s]+):(?<port>\d+)$/u
const PUBLISHED_PORT =
  /^\s*-\s*["']?(?:[\d.]+:)?(?<published>\d+):(?<target>\d+)(?:\/tcp)?["']?\s*$/gmu
const UNPACKED_TEMPLATE = /\$\{|<%|process\.env/u
const BARE_NAME = 'NAME'

const GROUPS: VariableGroup[] = [
  { prefix: 'PG', type: ConnectionType.Postgres },
  { prefix: 'POSTGRES_', type: ConnectionType.Postgres },
  { prefix: 'MYSQL_', type: ConnectionType.MySQL },
  {
    flavor: ConnectionFlavor.MariaDB,
    prefix: 'MARIADB_',
    type: ConnectionType.MySQL,
  },
  {
    fields: ['password'],
    prefix: 'MYSQL_ROOT_',
    type: ConnectionType.MySQL,
    user: 'root',
  },
  {
    fields: ['password'],
    flavor: ConnectionFlavor.MariaDB,
    prefix: 'MARIADB_ROOT_',
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
  { prefix: 'SPRING.DATASOURCE.' },
  { prefix: 'QUARKUS.DATASOURCE.' },
  { prefix: 'DB_' },
  { prefix: 'DATABASE_' },
  { prefix: '' },
]

const LINE =
  /^\s*(?:-\s+)?(?:export\s+)?["']?(?<key>[\w.-]+)["']?\s*(?:=|:(?=\s|$))\s*(?<value>.*)$/u
const QUOTED = /^(?<quote>["'`])(?<inner>.*)\k<quote>/u
const UNQUOTED_TAIL = /\s+#.*$|,$/u

const typeOfDriver = (name: string) =>
  TYPE_OF_DRIVER[name.toLowerCase()] ?? typeOfScheme(name)

/** The engine a `DB_CONNECTION=mariadb` style variable names. */
const engineNamedIn = (
  variables: Record<string, string>,
  prefix: string
): Pick<GuessedParts, 'flavor' | 'type'> => {
  const driver = TYPE_SUFFIXES.map((suffix) => variables[prefix + suffix] ?? '')
    .map((name) => name.split('.').at(-1) ?? '')
    .find(typeOfDriver)
  return driver
    ? { flavor: flavorOfScheme(driver), type: typeOfDriver(driver) }
    : {}
}

/** Keys must be uppercase. */
export const partsOfVariables = (
  variables: Record<string, string>
): GuessedParts | null => {
  const valueOf = (keys: string[]) =>
    keys
      .map((key) => variables[key])
      .find((value) => value && !UNPACKED_TEMPLATE.test(value)) ?? ''
  let parts: GuessedParts = {}

  for (const group of GROUPS) {
    const named = engineNamedIn(variables, group.prefix)
    const type = group.type ?? named.type
    const flavor = group.flavor ?? named.flavor
    const found: GuessedParts = {}
    for (const [field, suffixes] of objectEntries(SUFFIXES_OF_FIELD)) {
      if (!group.fields || group.fields.includes(field)) {
        found[field] = valueOf(
          suffixes
            .filter((suffix) => group.prefix || type || suffix !== BARE_NAME)
            .map((suffix) => group.prefix + suffix)
        )
      }
    }
    const address = HOST_AND_PORT.exec(found.host ?? '')?.groups
    if (address) {
      found.host = address.host
      found.port ||= address.port
    }
    if (
      !Object.values(found).some(Boolean) ||
      (!group.prefix && !type && !found.database && !found.password)
    ) {
      continue
    }
    if (!group.user || (!parts.user && !parts.password)) {
      parts = mergeParts(parts, { user: group.user, ...found })
    }
    parts = mergeParts(parts, { flavor, type })
  }

  return Object.keys(parts).some((key) => key !== 'flavor' && key !== 'type')
    ? parts
    : null
}

/** `KEY=value` lines of a `.env`, a YAML map or a command's environment prefix; keys come back uppercased. */
export const variablesOfLines = (lines: string[]) => {
  const variables: Record<string, string> = {}
  for (const line of lines) {
    const { key, value = '' } = LINE.exec(line)?.groups ?? {}
    if (key) {
      variables[key.toUpperCase()] ??=
        QUOTED.exec(value.trim())?.groups?.inner ??
        value.replace(UNQUOTED_TAIL, '').trim()
    }
  }
  return variables
}

export const guessEnv = (text: string): DatabaseGuess | null => {
  const parts = partsOfVariables(variablesOfLines(text.split('\n')))
  if (!parts) {
    return null
  }
  const composeTarget = parts.type && String(DEFAULT_PORTS[parts.type])
  const published =
    !parts.port &&
    composeTarget &&
    text
      .matchAll(PUBLISHED_PORT)
      .find(({ groups }) => groups?.target === composeTarget)?.groups?.published
  return {
    format: 'env',
    parts: published ? { host: 'localhost', ...parts, port: published } : parts,
  }
}
