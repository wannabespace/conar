import { afterEach, expect, jest, test } from 'bun:test'
import { PassThrough, Readable } from 'node:stream'

import { Result } from 'better-result'
import type { Client } from 'ssh2'

import { forwardOut } from './docker'

const STACK = '/app-db-1 db 172.18.0.2\n/app-adminer-1 adminer  172.18.0.3\n'

type Docker = { stdout: string; stderr?: string } | 'hangs'

const sshHost = ({
  docker = { stdout: STACK } as Docker,
  refused = [] as string[],
  resolves = [] as string[],
} = {}) => {
  const commands: string[] = []
  const closed: string[] = []
  const forwarded: string[] = []
  const client = {
    exec: (command: string, done: (error?: Error, out?: Readable) => void) => {
      commands.push(command)
      done(
        undefined,
        docker === 'hangs'
          ? Object.assign(new PassThrough(), {
              close: () => closed.push(command),
              stderr: new PassThrough(),
            })
          : Object.assign(Readable.from([docker.stdout]), {
              stderr: Readable.from([docker.stderr ?? '']),
            })
      )
    },
    forwardOut: (
      _source: string,
      _sourcePort: number,
      host: string,
      _port: number,
      done: (error?: Error, channel?: string) => void
    ) => {
      if (refused.includes(host)) {
        done(new Error('(SSH) Channel open failure: Connection refused'))
      } else if (resolves.includes(host) || /^[\d.]+$/u.test(host)) {
        forwarded.push(host)
        done(undefined, host)
      } else {
        done(new Error('(SSH) Channel open failure: Name does not resolve'))
      }
    },
  } as unknown as Client
  return { client, closed, commands, forwarded }
}

afterEach(() => {
  jest.useRealTimers()
})

test('a host the SSH host resolves is forwarded as written, even when a Compose service shares its name', async () => {
  const { client, commands, forwarded } = sshHost({ resolves: ['db'] })
  await forwardOut(client, 'db', 5432)
  expect(forwarded).toEqual(['db'])
  expect(commands).toEqual([])
})

test('a refused port is not redirected to a container', async () => {
  const { client, commands } = sshHost({ refused: ['db'] })
  await expect(forwardOut(client, 'db', 5432)).rejects.toThrow(
    'Connection refused'
  )
  expect(commands).toEqual([])
})

test('an unresolved Compose service forwards to its container, with one lookup for concurrent channels', async () => {
  const { client, commands, forwarded } = sshHost()
  await Promise.all([
    forwardOut(client, 'db', 5432),
    forwardOut(client, 'db', 5432),
  ])
  expect(forwarded).toEqual(['172.18.0.2', '172.18.0.2'])
  expect(commands).toHaveLength(1)
})

test('a container name resolves even when another stack runs the same service', async () => {
  const { client, forwarded } = sshHost({
    docker: { stdout: `${STACK}/other-db-1 db 172.19.0.2\n` },
  })
  await forwardOut(client, 'other-db-1', 5432)
  expect(forwarded).toEqual(['172.19.0.2'])
  await expect(forwardOut(client, 'db', 5432)).rejects.toThrow(
    'app-db-1, other-db-1'
  )
})

test('a name no container answers to fails with the SSH host error', async () => {
  const { client } = sshHost({ docker: { stdout: '' } })
  await expect(forwardOut(client, 'bastion-db', 5432)).rejects.toThrow(
    'Name does not resolve'
  )
})

test('an SSH user without Docker access is told so', async () => {
  const { client } = sshHost({
    docker: {
      stderr:
        'permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock\n',
      stdout: '',
    },
  })
  await expect(forwardOut(client, 'db', 5432)).rejects.toThrow('docker group')
})

test('a hung docker command is closed and the SSH host error is thrown', async () => {
  jest.useFakeTimers()
  const { client, closed } = sshHost({ docker: 'hangs' })
  const forwarding = Result.tryPromise(() => forwardOut(client, 'db', 5432))
  while (jest.getTimerCount() === 0) {
    // Fake timers also fake Bun.sleep, so only microtasks let the lookup arm its timer.
    // oxlint-disable-next-line no-await-in-loop
    await Promise.resolve()
  }
  jest.advanceTimersByTime(5000)
  const forwarded = await forwarding
  expect(forwarded.isErr() && String(forwarded.error.cause)).toContain(
    'Name does not resolve'
  )
  expect(closed).toHaveLength(1)
})
