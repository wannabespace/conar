import { createRequire } from 'node:module'

import type * as ShellParser from '@mongodb-js/shell-bson-parser'
import { memoize } from 'memoza'
import type * as Mongo from 'mongodb'
import type { MongoClientOptions } from 'mongodb'

import { describeConnectionString } from '../../../utils'

const require = createRequire(import.meta.url)

export const mongodb = require('mongodb') as typeof Mongo

/** Its ESM wrapper loses every export under Bun, so it loads through `require` like the drivers do. */
export const { parse: parseShellValue } =
  require('@mongodb-js/shell-bson-parser') as typeof ShellParser

type Lookup = NonNullable<MongoClientOptions['lookup']>

let lookup: Lookup | undefined

/**
 * The driver resolves every server it connects to through this, the ones a replica set or an SRV record names included,
 * so a host that must stay unreachable (the cloud proxy's private network) is refused there and not only at the seed.
 */
export const mongodbLookup = {
  use: (guard: Lookup) => {
    lookup = guard
  },
}

export const getClient = memoize(async (connectionString: string) => {
  // The driver opens a socket per server it discovers and takes no stream, so an SSH channel has nothing to plug into.
  if (describeConnectionString(connectionString).usesSsh) {
    throw new Error('MongoDB connections cannot use an SSH tunnel yet.')
  }
  const client = new mongodb.MongoClient(connectionString, {
    appName: 'Tamery',
    ...(lookup && { lookup }),
  })
  await client.connect()
  return client
})

export const supportsTransactions = memoize(
  async (connectionString: string) => {
    const client = await getClient(connectionString)
    const hello = await client.db('admin').command({ hello: 1 })
    return Boolean(hello.setName) || hello.msg === 'isdbgrid'
  }
)
