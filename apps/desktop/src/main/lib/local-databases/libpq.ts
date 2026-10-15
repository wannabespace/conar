import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'

import { guessPgpass } from '@tamery/connection/guess/host'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { type } from 'arktype'
import ini from 'ini'

import { localDatabase } from './local-database'

const serviceSchema = type({
  'dbname?': 'string',
  'host?': 'string',
  'password?': 'string',
  'port?': 'string',
  'user?': 'string',
})

export const pgpassDatabases = async () => {
  const pgpass = await readFile(
    process.env.PGPASSFILE ?? path.join(homedir(), '.pgpass'),
    'utf-8'
  )
  return pgpass
    .split('\n')
    .filter((line) => !line.startsWith('#'))
    .flatMap((line) => {
      const guess = guessPgpass(line)
      return guess ? [localDatabase('.pgpass', '', guess.parts)] : []
    })
}

export const pgServiceDatabases = async () => {
  const services = ini.parse(
    await readFile(
      process.env.PGSERVICEFILE ?? path.join(homedir(), '.pg_service.conf'),
      'utf-8'
    )
  )
  return Object.entries(services).map(([name, service]) => {
    const {
      dbname,
      host = 'localhost',
      ...rest
    } = serviceSchema.assert(service)
    return localDatabase('pg_service.conf', name, {
      ...rest,
      database: dbname,
      host,
      type: ConnectionType.Postgres,
    })
  })
}
