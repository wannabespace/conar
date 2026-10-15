import {
  ConnectionFlavor,
  ConnectionType,
} from '@tamery/shared/enums/connection-type'

import { mssqlAddress } from './ado'
import { partsOfVariables, variablesOfLines } from './env'
import { guessKeyValue } from './key-value'
import { mergeParts } from './parts'
import { shellCommands } from './tokens'
import type { DatabaseGuess, ServerField } from './types'
import { guessUrl } from './url'

type Field = ServerField | 'server'

interface Client {
  flavor?: ConnectionFlavor
  /** Flags that prompt when bare, so their value must be glued on: `-pSECRET`, `--password=SECRET`. */
  gluedOnly?: string[]
  /** Every flag that takes a value; `null` drops the value instead of reading it as a positional. */
  options: Record<string, Field | null>
  positionals: ServerField[]
  type: ConnectionType
}

const PSQL: Client = {
  options: {
    '--command': null,
    '--dbname': 'database',
    '--file': null,
    '--host': 'host',
    '--port': 'port',
    '--username': 'user',
    '-U': 'user',
    '-c': null,
    '-d': 'database',
    '-f': null,
    '-h': 'host',
    '-p': 'port',
    '-v': null,
  },
  positionals: ['database', 'user'],
  type: ConnectionType.Postgres,
}

const MYSQL: Client = {
  gluedOnly: ['-p', '--password'],
  options: {
    '--database': 'database',
    '--execute': null,
    '--host': 'host',
    '--password': 'password',
    '--port': 'port',
    '--socket': null,
    '--user': 'user',
    '-D': 'database',
    '-P': 'port',
    '-S': null,
    '-e': null,
    '-h': 'host',
    '-p': 'password',
    '-u': 'user',
  },
  positionals: ['database'],
  type: ConnectionType.MySQL,
}

const MARIADB: Client = { ...MYSQL, flavor: ConnectionFlavor.MariaDB }

const SQLCMD: Client = {
  options: {
    '-P': 'password',
    '-Q': null,
    '-S': 'server',
    '-U': 'user',
    '-d': 'database',
    '-i': null,
    '-o': null,
    '-q': null,
  },
  positionals: [],
  type: ConnectionType.MSSQL,
}

const CLICKHOUSE: Client = {
  options: {
    '--database': 'database',
    '--host': 'host',
    '--password': 'password',
    '--port': 'port',
    '--query': null,
    '--user': 'user',
    '-d': 'database',
    '-h': 'host',
    '-q': null,
    '-u': 'user',
  },
  positionals: [],
  type: ConnectionType.ClickHouse,
}

const CLIENTS: Record<string, Client> = {
  clickhouse: CLICKHOUSE,
  'clickhouse-client': CLICKHOUSE,
  mariadb: MARIADB,
  'mariadb-dump': MARIADB,
  mycli: MYSQL,
  mysql: MYSQL,
  mysqldump: MYSQL,
  pg_dump: PSQL,
  pgcli: PSQL,
  psql: PSQL,
  sqlcmd: SQLCMD,
}

const FLAG = /^(?<flag>--[^=]+|-[^-])=?(?<glued>.*)$/su
const CONNINFO = /:\/\/|=/u

const basename = (token = '') => token.split('/').at(-1) ?? ''

const readArgs = (client: Client, args: string[]) => {
  const found: Partial<Record<Field, string>> = {}
  const positionals: string[] = []
  while (args.length > 0) {
    const arg = args.shift() ?? ''
    const { flag = '', glued = '' } = FLAG.exec(arg)?.groups ?? {}
    if (!flag) {
      positionals.push(arg)
    } else if (Object.hasOwn(client.options, flag)) {
      const value =
        glued || (client.gluedOnly?.includes(flag) ? '' : args.shift())
      const field = client.options[flag]
      if (field && value) {
        found[field] ??= value
      }
    }
  }
  return { found, positionals }
}

const guessCommand = (tokens: string[]): DatabaseGuess | null => {
  const start = tokens.findIndex(
    (token, index) =>
      Object.hasOwn(CLIENTS, basename(token)) &&
      (basename(token) !== 'clickhouse' || tokens[index + 1] === 'client')
  )
  const client = CLIENTS[basename(tokens[start])]
  if (!client) {
    return null
  }

  const {
    found: { server = '', ...found },
    positionals,
  } = readArgs(client, tokens.slice(start + 1))
  const conninfo = positionals.find((positional) => CONNINFO.test(positional))
  const conninfoGuess = conninfo
    ? (guessUrl(conninfo) ?? guessKeyValue(conninfo))
    : null
  const plain = positionals.filter((positional) => positional !== conninfo)
  for (const [index, field] of client.positionals.entries()) {
    found[field] ??= plain[index]
  }

  return {
    format: 'cli',
    parts: mergeParts(
      found,
      mssqlAddress(server),
      conninfoGuess?.parts ?? {},
      partsOfVariables(variablesOfLines(tokens.slice(0, start))) ?? {},
      { flavor: client.flavor, type: client.type }
    ),
  }
}

export const guessCli = (text: string): DatabaseGuess | null =>
  text
    .split('\n')
    .values()
    .map((line) => guessCommand(shellCommands(line)[0] ?? []))
    .find(Boolean) ?? null
