import type { Engine } from '@tamery/shared/enums/connection-type'
import {
  ConnectionFlavor,
  ConnectionType,
  engines,
} from '@tamery/shared/enums/connection-type'
import { objectEntries } from '@tamery/shared/utils'

import { DEFAULT_PORTS, engineOfDriver } from '../connection-parts'
import { mergeParts } from './parts'
import type { DatabaseGuess, GuessedParts, ServerField } from './types'

interface VariableGroup {
  engine?: Engine
  /** Only these fields are read under the prefix: `MYSQL_ROOT_HOST` is an allow-list, not a host. */
  fields?: ServerField[]
  prefix: string
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
const HOST_AND_PORT = /^(?<host>[^:\s]+):(?<port>\d+)$/u
const PUBLISHED_PORT =
  /^\s*-\s*["']?(?:[\d.]+:)?(?<published>\d+):(?<target>\d+)(?:\/tcp)?["']?\s*$/gmu
const UNPACKED_TEMPLATE = /\$\{|<%|process\.env/u
const BARE_NAME = 'NAME'

const GROUPS: VariableGroup[] = [
  { engine: ConnectionType.Postgres, prefix: 'PG' },
  { engine: ConnectionType.Postgres, prefix: 'POSTGRES_' },
  { engine: ConnectionType.MySQL, prefix: 'MYSQL_' },
  { engine: ConnectionFlavor.MariaDB, prefix: 'MARIADB_' },
  {
    engine: ConnectionType.MySQL,
    fields: ['password'],
    prefix: 'MYSQL_ROOT_',
    user: 'root',
  },
  {
    engine: ConnectionFlavor.MariaDB,
    fields: ['password'],
    prefix: 'MARIADB_ROOT_',
    user: 'root',
  },
  { engine: ConnectionType.ClickHouse, prefix: 'CLICKHOUSE_' },
  { engine: ConnectionType.MSSQL, prefix: 'MSSQL_' },
  {
    engine: ConnectionType.MSSQL,
    fields: ['password'],
    prefix: 'MSSQL_SA_',
    user: 'sa',
  },
  {
    engine: ConnectionType.MSSQL,
    fields: ['password'],
    prefix: 'SA_',
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

/** Keys must be uppercase. */
export const partsOfVariables = (
  variables: Record<string, string>
): GuessedParts | null => {
  const valueOf = (keys: string[]) =>
    keys
      .map((key) => variables[key])
      .find((value) => value && !UNPACKED_TEMPLATE.test(value)) ?? ''
  let parts: GuessedParts = {}
  let engine: GuessedParts['engine']

  for (const group of GROUPS) {
    const named =
      group.engine ??
      TYPE_SUFFIXES.values()
        .map((suffix) =>
          engineOfDriver(
            variables[group.prefix + suffix]?.split('.').at(-1) ?? ''
          )
        )
        .find(Boolean)
    const found: GuessedParts = {}
    for (const [field, suffixes] of objectEntries(SUFFIXES_OF_FIELD)) {
      if (!group.fields || group.fields.includes(field)) {
        found[field] = valueOf(
          suffixes
            .filter((suffix) => group.prefix || named || suffix !== BARE_NAME)
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
      (!group.prefix && !named && !found.database && !found.password)
    ) {
      continue
    }
    if (!group.user || (!parts.user && !parts.password)) {
      parts = mergeParts(parts, { user: group.user, ...found })
    }
    engine ??= named
  }

  return Object.keys(parts).length > 0 ? mergeParts(parts, { engine }) : null
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
  const composeTarget =
    parts.engine && String(DEFAULT_PORTS[engines.type(parts.engine)])
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
