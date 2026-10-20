import { createRequire } from 'node:module'

import type * as ShellParser from '@mongodb-js/shell-bson-parser'
import { SafeURL } from '@tamery/shared/safe-url'
import { Result } from 'better-result'
import { memoize } from 'memoza'
import type * as Mongo from 'mongodb'
import type { MongoClientOptions } from 'mongodb'

import { sshForwarding } from '../../../ssh/forwarding'
import { deleteSshParams } from '../../../ssh/params'
import { socksProxy } from '../../../ssh/socks'

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
  const forwarding = await sshForwarding.of(connectionString)
  const url = new SafeURL(connectionString)
  deleteSshParams(url.searchParams)
  // The driver takes no stream and dials every replica set member itself, so a tunnel reaches it as a SOCKS proxy.
  const proxy = forwarding && (await socksProxy(forwarding))
  const client = new mongodb.MongoClient(url.toString(), {
    appName: 'Tamery',
    ...(lookup && { lookup }),
    ...proxy?.options,
  })
  const connected = await Result.tryPromise(() => client.connect())
  if (connected.isErr()) {
    proxy?.close()
    throw connected.error.cause
  }
  return client
})

export const supportsTransactions = memoize(
  async (connectionString: string) => {
    const client = await getClient(connectionString)
    const hello = await client.db('admin').command({ hello: 1 })
    return Boolean(hello.setName) || hello.msg === 'isdbgrid'
  }
)
