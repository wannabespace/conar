import { glob, readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'

import { guessConnection } from '@tamery/connection/guess'
import { tryCatchAsync } from '@tamery/shared/utils'
import { type } from 'arktype'
import { app } from 'electron'
import { XMLParser } from 'fast-xml-parser'

import { keychainPassword } from './keychain'
import type { Finder } from './local-database'
import { validEntries } from './local-database'

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

const fileSchema = type({
  project: { component: type({ 'data-source?': 'unknown[]' }).array() },
})

const dataSourceSchema = type({
  'jdbc-url?': 'string',
  name: 'string',
  'user-name?': 'string',
  'uuid?': 'string',
})

const dataSourcesIn = async (file: string) =>
  validEntries(
    dataSourceSchema,
    fileSchema
      .assert(parser.parse(await readFile(file, 'utf-8')))
      .project.component.flatMap((component) => component['data-source'] ?? [])
  )

export const dataGrip: Finder = {
  files: () => Array.fromAsync(glob(DATA_SOURCE_FILES)),
  read: async (file) => {
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
    return dataSources.map(({ 'jdbc-url': url = '', name, uuid }) => {
      const parts = guessConnection(url)?.parts ?? {}
      return {
        name,
        parts: { ...parts, user: parts.user || (uuid && userOf.get(uuid)) },
        unlock: uuid
          ? () =>
              // JetBrains' own service name, em dash included: any other character finds nothing.
              keychainPassword({ service: `IntelliJ Platform DB — ${uuid}` })
          : undefined,
      }
    })
  },
  source: 'DataGrip',
}
