import { createHash, createHmac } from 'node:crypto'
import { appendFile, mkdir, readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'

import { tryCatchAsync } from '@tamery/shared/utils'

import { DEFAULT_SSH_PORT } from './params'

export type HostKeyStatus = 'changed' | 'known' | 'revoked' | 'unknown'

const HASHED_PREFIX = '|1|'

const knownHostsPath = () => path.join(homedir(), '.ssh', 'known_hosts')

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
    return (
      createHmac('sha1', Buffer.from(salt, 'base64'))
        .update(name)
        .digest('base64') === hash
    )
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

const keyTypeOf = (key: Buffer) =>
  key.subarray(4, 4 + key.readUInt32BE(0)).toString()

/** The user's own `~/.ssh/known_hosts`, read and written the way OpenSSH does, so a host trusted in a terminal is trusted here too. */
export const knownHosts = {
  check: (contents: string, name: string, key: Buffer): HostKeyStatus => {
    const encoded = key.toString('base64')
    let status: HostKeyStatus = 'unknown'
    for (const line of contents.split('\n')) {
      const fields = line.trim().split(/\s+/u)
      const marker = fields[0]?.startsWith('@') ? fields.shift() : undefined
      const [hosts = '', keyType, keyData] = fields
      if (!hosts || hosts.startsWith('#') || !hostsMatch(hosts, name)) {
        continue
      }
      if (marker === '@revoked' && keyData === encoded) {
        return 'revoked'
      }
      if (marker) {
        continue
      }
      if (keyData === encoded) {
        status = 'known'
      } else if (status === 'unknown' && keyType === keyTypeOf(key)) {
        status = 'changed'
      }
    }
    return status
  },
  describe: (key: Buffer) => ({
    fingerprint: `SHA256:${createHash('sha256').update(key).digest('base64').replace(/=+$/u, '')}`,
    keyType: keyTypeOf(key),
  }),
  nameOf: (host: string, port: number) =>
    port === DEFAULT_SSH_PORT ? host : `[${host}]:${port}`,
  read: async () => {
    const { data } = await tryCatchAsync(() =>
      readFile(knownHostsPath(), 'utf-8')
    )
    return data ?? ''
  },
  trust: async (name: string, key: Buffer) => {
    const contents = await knownHosts.read()
    const separator = contents && !contents.endsWith('\n') ? '\n' : ''
    await mkdir(path.dirname(knownHostsPath()), {
      mode: 0o700,
      recursive: true,
    })
    await appendFile(
      knownHostsPath(),
      `${separator}${name} ${keyTypeOf(key)} ${key.toString('base64')}\n`,
      { mode: 0o600 }
    )
  },
}
