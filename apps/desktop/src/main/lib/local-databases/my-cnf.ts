import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'

import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { type } from 'arktype'
import ini from 'ini'

import { localDatabase } from './local-database'

const clientSchema = type({
  'database?': 'string',
  'host?': 'string',
  'password?': 'string',
  'port?': 'string',
  'user?': 'string',
})

export const myCnfDatabases = async () => {
  const { client, mysql } = ini.parse(
    await readFile(path.join(homedir(), '.my.cnf'), 'utf-8')
  )
  if (!client && !mysql) {
    return []
  }
  // The mysql client reads [client] first and lets [mysql] override it.
  const { host = 'localhost', ...rest } = clientSchema.assert({
    ...client,
    ...mysql,
  })
  return [
    localDatabase('.my.cnf', '', { ...rest, host, type: ConnectionType.MySQL }),
  ]
}
