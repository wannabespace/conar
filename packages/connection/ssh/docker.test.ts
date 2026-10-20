import { expect, test } from 'bun:test'
import { Readable } from 'node:stream'

import type { Client } from 'ssh2'

import { dockerAddress } from './docker'

const dockerHost = (inspected: string) => {
  const commands: string[] = []
  const client = {
    exec: (command: string, done: (error?: Error, out?: Readable) => void) => {
      commands.push(command)
      const ids = inspected ? 'a1\nb2\n' : ''
      done(
        undefined,
        Readable.from([command === 'docker ps -q' ? ids : inspected])
      )
    },
  } as unknown as Client
  return { client, commands }
}

const STACK = '/app-db-1 db 172.18.0.2\n/app-adminer-1 adminer  172.18.0.3\n'

test('a Compose service resolves to its container address', async () => {
  const { client } = dockerHost(STACK)
  expect(await dockerAddress(client, 'db')).toBe('172.18.0.2')
})

test('a container name resolves even when another stack runs the same service', async () => {
  const { client } = dockerHost(`${STACK}/other-db-1 db 172.19.0.2\n`)
  expect(await dockerAddress(client, 'other-db-1')).toBe('172.19.0.2')
  await expect(dockerAddress(client, 'db')).rejects.toThrow(
    'app-db-1, other-db-1'
  )
})

test('a host no container answers to stays as written', async () => {
  const { client } = dockerHost('')
  expect(await dockerAddress(client, 'bastion-db')).toBe('bastion-db')
})

test('a dotted host or localhost never runs a command on the SSH host', async () => {
  const { client, commands } = dockerHost(STACK)
  expect(await dockerAddress(client, 'db.internal')).toBe('db.internal')
  expect(await dockerAddress(client, 'localhost')).toBe('localhost')
  expect(commands).toEqual([])
})
