import '@tamery/shared/arktype-config'
import { afterAll, beforeAll, describe, expect, it, mock } from 'bun:test'
import { createCipheriv, randomBytes } from 'node:crypto'
import { once } from 'node:events'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import type { Server } from 'node:http'
import { createServer } from 'node:http'
import * as os from 'node:os'
import path from 'node:path'

import { connectionParts } from '@tamery/connection/connection-parts'

const home = await mkdtemp(path.join(os.tmpdir(), 'local-databases-'))
mock.module('node:os', () => ({ ...os, homedir: () => home }))
mock.module('electron', () => ({
  app: { getPath: () => path.join(home, 'appData') },
}))
process.env.DOCKER_HOST = `unix://${path.join(home, 'docker.sock')}`
delete process.env.PGPASSFILE
delete process.env.PGSERVICEFILE

const { localDatabases } = await import('./find')

const DBEAVER_KEY = Buffer.from('babb4a9f774ab853c96c2d653dfe544a', 'hex')

const write = async (file: string, content: string | Buffer) => {
  await mkdir(path.dirname(path.join(home, file)), { recursive: true })
  await writeFile(path.join(home, file), content)
}

const dbeaverCredentials = (credentials: object) => {
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-128-cbc', DBEAVER_KEY, iv)
  return Buffer.concat([
    iv,
    cipher.update(JSON.stringify(credentials)),
    cipher.final(),
  ])
}

const DOCKER_ANSWERS: Record<string, unknown> = {
  '/containers/c1/json': {
    Config: {
      Env: [
        'MARIADB_ROOT_PASSWORD=a=b',
        'MARIADB_DATABASE=shop',
        'PATH=/usr/bin',
      ],
    },
  },
  '/containers/c2/json': {
    Config: { Env: ['MYSQL_ROOT_PASSWORD=pw'] },
  },
  '/containers/c3/json': {
    Config: { Env: ['POSTGRES_USER=me', 'POSTGRES_PASSWORD=pw'] },
  },
  '/containers/json': [
    {
      Id: 'c1',
      Image: 'acme/db:1',
      Names: ['/maria'],
      Ports: [{ IP: '0.0.0.0', PrivatePort: 3306, PublicPort: 13_306 }],
    },
    {
      Id: 'c2',
      Image: 'ghcr.io/acme/mariadb:11',
      Names: ['/maria-image'],
      Ports: [{ IP: '0.0.0.0', PrivatePort: 3306, PublicPort: 13_307 }],
    },
    {
      Id: 'c3',
      Image: 'postgres:16',
      Names: ['/mysql-port'],
      Ports: [{ IP: '0.0.0.0', PrivatePort: 3306, PublicPort: 13_308 }],
    },
    {
      Id: 'exited',
      Image: 'postgres:16',
      Names: ['/gone'],
      Ports: [{ IP: '0.0.0.0', PrivatePort: 5432, PublicPort: 15_432 }],
    },
  ],
}

let docker: Server

beforeAll(async () => {
  await write(
    'Library/DBeaverData/workspace6/General/.dbeaver/data-sources.json',
    JSON.stringify({
      connections: {
        broken: { name: 'No configuration', provider: 'postgresql' },
        'pg-1': {
          configuration: {
            database: 'app',
            host: 'localhost',
            port: 5433,
            user: 'me',
          },
          name: 'Local app',
          provider: 'postgresql',
        },
        'pg-2': {
          configuration: {
            database: 'other',
            host: 'localhost',
            port: 5434,
            user: 'me',
          },
          name: 'No saved password',
          provider: 'postgresql',
        },
      },
    })
  )
  await write(
    'Library/DBeaverData/workspace6/General/.dbeaver/credentials-config.json',
    dbeaverCredentials({
      'pg-1': { '#connection': { password: 's3cret', user: 'admin' } },
    })
  )
  await write(
    'DataGripProjects/p/.idea/dataSources.xml',
    '<project version="4"><component name="DataSourceManagerImpl"><data-source name="Warehouse" uuid="u-1"><jdbc-url>jdbc:mysql://localhost:3307/shop</jdbc-url></data-source></component></project>'
  )
  await write(
    'DataGripProjects/p/.idea/dataSources.local.xml',
    '<project version="4"><component name="dataSourceStorageLocal"><data-source name="Warehouse" uuid="u-1"><user-name>reader</user-name></data-source></component></project>'
  )
  await write('DataGripProjects/broken/.idea/dataSources.xml', '<project/>')
  await write('.pgpass', 'localhost:5434:other:me:from-pgpass\n')
  await write(
    '.my.cnf',
    '[client]\nuser=root\npassword=pw\nhost=db.local\n[mysql]\nuser=dev\n'
  )
  await write(
    'Library/Application Support/com.tinyapp.TablePlus/Data/Connections.plist',
    JSON.stringify([
      { ConnectionName: 'No driver', ID: 't-0' },
      {
        ConnectionName: 'Maria',
        DatabaseHost: 'localhost',
        DatabaseName: 'shop',
        DatabasePort: '3308',
        DatabaseUser: 'root',
        Driver: 'MariaDB',
        ID: 't-1',
      },
    ])
  )
  docker = createServer((request, response) => {
    response.end(JSON.stringify(DOCKER_ANSWERS[request.url ?? '']))
  })
  await once(docker.listen(path.join(home, 'docker.sock')), 'listening')
})

afterAll(async () => {
  docker.close()
  await rm(home, { force: true, recursive: true })
})

const findIn = async (source: string, name: string) => {
  const found = await localDatabases.find()
  const database = found.find(
    (candidate) => candidate.source === source && candidate.name === name
  )
  return (
    database && {
      ...connectionParts.parse(database.connectionString),
      engine: database.engine,
    }
  )
}

describe('localDatabases', () => {
  it('never puts a password in a found connection string', async () => {
    const found = await localDatabases.find()
    expect(found.length).toBeGreaterThan(0)
    for (const { connectionString } of found) {
      expect(connectionParts.parse(connectionString).password).toBe('')
    }
  })

  it('hands out a found password only through unlock, from a later source when the first saved none', async () => {
    const found = await localDatabases.find()
    const passwords = await Promise.all(
      found
        .filter(({ source }) => source !== 'TablePlus' && source !== 'DataGrip')
        .map(async ({ connectionString, name, source }) => {
          const { password } = await localDatabases.unlock(connectionString)
          return [`${source} ${name}`, password]
        })
    )
    expect(passwords).toEqual(
      expect.arrayContaining([
        ['DBeaver Local app', 's3cret'],
        ['DBeaver No saved password', 'from-pgpass'],
        ['.my.cnf db.local', 'pw'],
        ['Docker maria', 'a=b'],
      ])
    )
  })

  it('unlocks nothing for a string find never returned', async () => {
    expect(
      await localDatabases.unlock('postgresql://me@elsewhere/app')
    ).toEqual({ password: '', withheld: false })
  })

  it.each([
    [
      'DBeaver: decrypted user over the configured one, odd entries skipped',
      'DBeaver',
      'Local app',
      { database: 'app', host: 'localhost', port: '5433', user: 'admin' },
    ],
    [
      'DataGrip: user from the .local.xml beside the data source, a broken file skipped',
      'DataGrip',
      'Warehouse',
      { database: 'shop', port: '3307', user: 'reader' },
    ],
    [
      '.my.cnf: [mysql] overrides [client]',
      '.my.cnf',
      'db.local',
      { host: 'db.local', user: 'dev' },
    ],
    [
      'Docker: MariaDB credentials and flavor from the container env, a container whose inspect fails skipped',
      'Docker',
      'maria',
      {
        database: 'shop',
        engine: 'mariadb',
        host: 'localhost',
        port: '13306',
        user: 'root',
      },
    ],
    [
      "Docker: the image's MariaDB flavor over the env's MySQL",
      'Docker',
      'maria-image',
      { engine: 'mariadb', port: '13307', user: 'root' },
    ],
    [
      "Docker: the published port's engine over the env's and the image's",
      'Docker',
      'mysql-port',
      { engine: 'mysql', port: '13308' },
    ],
  ])('%s', async (_case, source, name, parts) => {
    expect(await findIn(source, name)).toMatchObject(parts)
  })

  it.skipIf(process.platform !== 'darwin')(
    'TablePlus: MariaDB driver keeps its flavor, odd entries skipped',
    async () => {
      expect(await findIn('TablePlus', 'Maria')).toMatchObject({
        database: 'shop',
        engine: 'mariadb',
        port: '3308',
      })
    }
  )
})
