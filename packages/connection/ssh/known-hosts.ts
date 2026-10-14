import { createHash, createHmac, randomBytes } from 'node:crypto'
import { appendFile, mkdir, readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'

import { tryCatchAsync } from '@tamery/shared/utils'
import type { ServerHostKeyAlgorithm } from 'ssh2'

import { DEFAULT_SSH_PORT } from './params'

export type HostKeyStatus = 'changed' | 'known' | 'revoked' | 'unknown'

const HASHED_PREFIX = '|1|'
const HASH_SALT_BYTES = 20

const SERVER_HOST_KEY_ALGORITHMS: ServerHostKeyAlgorithm[] = [
  'ssh-ed25519',
  'ecdsa-sha2-nistp256',
  'ecdsa-sha2-nistp384',
  'ecdsa-sha2-nistp521',
  'rsa-sha2-512',
  'rsa-sha2-256',
  'ssh-rsa',
]

const userKnownHostsPath = () => path.join(homedir(), '.ssh', 'known_hosts')
// OpenSSH's default UserKnownHostsFile and GlobalKnownHostsFile: a key listed in any of them makes another key a mismatch.
const knownHostsPaths = () => [
  userKnownHostsPath(),
  `${userKnownHostsPath()}2`,
  '/etc/ssh/ssh_known_hosts',
  '/etc/ssh/ssh_known_hosts2',
]

const readOrEmpty = async (file: string) => {
  const { data } = await tryCatchAsync(() => readFile(file, 'utf-8'))
  return data ?? ''
}

const hashOf = (salt: Buffer, name: string) =>
  createHmac('sha1', salt).update(name).digest('base64')

const globMatches = (pattern: string, name: string) =>
  new RegExp(
    `^${pattern
      .replaceAll(/[.+^${}()|[\]\\]/gu, String.raw`\$&`)
      .replaceAll('*', '.*')
      .replaceAll('?', '.')}$`,
    'iu'
  ).test(name)

const hostsMatch = (hosts: string, name: string) => {
  if (hosts.startsWith(HASHED_PREFIX)) {
    const [salt = '', hash] = hosts.slice(HASHED_PREFIX.length).split('|')
    return hashOf(Buffer.from(salt, 'base64'), name) === hash
  }
  const patterns = hosts.split(',')
  return (
    patterns.some(
      (pattern) => !pattern.startsWith('!') && globMatches(pattern, name)
    ) &&
    !patterns.some(
      (pattern) =>
        pattern.startsWith('!') && globMatches(pattern.slice(1), name)
    )
  )
}

const entriesFor = (contents: string, name: string) =>
  contents.split('\n').flatMap((line) => {
    const fields = line.trim().split(/\s+/u)
    const marker = fields[0]?.startsWith('@') ? fields.shift() : undefined
    const [hosts = '', keyType = '', keyData = ''] = fields
    return hosts && !hosts.startsWith('#') && hostsMatch(hosts, name)
      ? [{ keyData, keyType, marker }]
      : []
  })

const keyTypeOf = (key: Buffer) =>
  key.subarray(4, 4 + key.readUInt32BE(0)).toString()

const keyTypeOfAlgorithm = (algorithm: ServerHostKeyAlgorithm) =>
  algorithm.startsWith('rsa-sha2-') ? 'ssh-rsa' : algorithm

export const knownHosts = {
  /** Any listed key for the host other than this one refuses it, whatever its type: the algorithm order makes a server that still has the listed type present it. */
  check: (contents: string, name: string, key: Buffer): HostKeyStatus => {
    const encoded = key.toString('base64')
    const entries = entriesFor(contents, name)
    if (
      entries.some(
        (entry) => entry.marker === '@revoked' && entry.keyData === encoded
      )
    ) {
      return 'revoked'
    }
    const listed = entries.filter((entry) => !entry.marker)
    if (listed.some((entry) => entry.keyData === encoded)) {
      return 'known'
    }
    return listed.length > 0 ? 'changed' : 'unknown'
  },
  describe: (key: Buffer) => ({
    fingerprint: `SHA256:${createHash('sha256').update(key).digest('base64').replace(/=+$/u, '')}`,
    keyType: keyTypeOf(key),
  }),
  lineOf: (name: string, key: Buffer, { hashed }: { hashed: boolean }) => {
    const salt = randomBytes(HASH_SALT_BYTES)
    const hosts = hashed
      ? `${HASHED_PREFIX}${salt.toString('base64')}|${hashOf(salt, name)}`
      : name
    return `${hosts} ${keyTypeOf(key)} ${key.toString('base64')}`
  },
  /** Host key algorithms with the types listed for the host first, as OpenSSH orders them; empty when the host isn't listed. */
  listedAlgorithms: (contents: string, name: string) => {
    const listed = new Set(
      entriesFor(contents, name)
        .filter((entry) => !entry.marker)
        .map((entry) => entry.keyType)
    )
    return listed.size === 0
      ? []
      : SERVER_HOST_KEY_ALGORITHMS.toSorted(
          (a, b) =>
            Number(listed.has(keyTypeOfAlgorithm(b))) -
            Number(listed.has(keyTypeOfAlgorithm(a)))
        )
  },
  nameOf: ({
    alias,
    host,
    port,
  }: {
    alias?: string
    host: string
    port: number
  }) => {
    if (alias) {
      return alias
    }
    const name = host.toLowerCase()
    return port === DEFAULT_SSH_PORT ? name : `[${name}]:${port}`
  },
  read: async () => {
    const files = await Promise.all(knownHostsPaths().map(readOrEmpty))
    return files.join('\n')
  },
  trust: async (name: string, key: Buffer, { hashed }: { hashed: boolean }) => {
    const contents = await readOrEmpty(userKnownHostsPath())
    const separator = contents && !contents.endsWith('\n') ? '\n' : ''
    await mkdir(path.dirname(userKnownHostsPath()), {
      mode: 0o700,
      recursive: true,
    })
    await appendFile(
      userKnownHostsPath(),
      `${separator}${knownHosts.lineOf(name, key, { hashed })}\n`,
      { mode: 0o600 }
    )
  },
}
