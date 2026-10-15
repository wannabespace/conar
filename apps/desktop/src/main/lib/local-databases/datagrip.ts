import { glob, readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'

import { guessConnection } from '@tamery/connection/guess'
import { tryCatchAsync } from '@tamery/shared/utils'
import { type } from 'arktype'
import { app } from 'electron'
import { XMLParser } from 'fast-xml-parser'

import { keychain } from './keychain'
import { localDatabase } from './local-database'

const DATA_SOURCE_FILES = [
  path.join(app.getPath('appData'), 'JetBrains/*/options/dataSources.xml'),
  path.join(
    app.getPath('appData'),
    'JetBrains/*/projects/*/.idea/dataSources.xml'
  ),
  path.join(homedir(), 'DataGripProjects/*/.idea/dataSources.xml'),
]

const parser = new XMLParser({
  attributeNamePrefix: '',
  ignoreAttributes: false,
  isArray: (tag) => tag === 'component' || tag === 'data-source',
  parseTagValue: false,
})

const dataSourcesSchema = type({
  project: {
    component: type({
      'data-source?': type({
        'jdbc-url?': 'string',
        name: 'string',
        'user-name?': 'string',
        'uuid?': 'string',
      }).array(),
    }).array(),
  },
})

const dataSourcesIn = async (file: string) =>
  dataSourcesSchema
    .assert(parser.parse(await readFile(file, 'utf-8')))
    .project.component.flatMap((component) => component['data-source'] ?? [])

const databasesIn = async (file: string) => {
  const [dataSources, local] = await Promise.all([
    dataSourcesIn(file),
    tryCatchAsync(() => dataSourcesIn(file.replace(/\.xml$/u, '.local.xml'))),
  ])
  const userOf = new Map(
    (local.data ?? []).map((dataSource) => [
      dataSource.uuid,
      dataSource['user-name'],
    ])
  )
  return dataSources.map((dataSource) => {
    const parts = guessConnection(dataSource['jdbc-url'] ?? '')?.parts ?? {}
    const database = localDatabase('DataGrip', dataSource.name, {
      ...parts,
      user: parts.user || userOf.get(dataSource.uuid),
    })
    if (dataSource.uuid) {
      // JetBrains' own service name, em dash included: any other character finds nothing.
      keychain.remember(database.connectionString, {
        service: `IntelliJ Platform DB — ${dataSource.uuid}`,
      })
    }
    return database
  })
}

export const dataGripDatabases = async () => {
  const files = await Array.fromAsync(glob(DATA_SOURCE_FILES))
  const found = await Promise.all(files.map(databasesIn))
  return found.flat()
}
