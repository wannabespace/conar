import { describe, expect, it } from 'bun:test'

import type { ServerHostKeyAlgorithm } from 'ssh2'

import type { HostKeyStatus } from './known-hosts'
import { knownHosts } from './known-hosts'

const KEY =
  'AAAAC3NzaC1lZDI1NTE5AAAAIA5ZQGz/jkvzkrmq7wh10u7paft8xgs+DXjosBeu7fNZ'
const OTHER_KEY =
  'AAAAC3NzaC1lZDI1NTE5AAAAIINvYImuUJD0pYs1LbT2zG+TZ9TozGMtt7sepVkItZPM'
const HASHED_LINE = `|1|Fwo54sDnpLmOfgRmRM5QESILxsE=|Cq0kDhB0/5f1yQWlJZakVEY3OpA= ssh-ed25519 ${KEY}`
const ECDSA_KEY = 'AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTY='

const key = Buffer.from(KEY, 'base64')

describe('knownHosts.check', () => {
  it.each<[string, string, HostKeyStatus]>([
    ['a plain entry', `bastion.example.com ssh-ed25519 ${KEY}`, 'known'],
    ['a hashed entry', HASHED_LINE, 'known'],
    ['a wildcard entry', `*.example.com ssh-ed25519 ${KEY}`, 'known'],
    [
      'a negated pattern',
      `*.example.com,!bastion.example.com ssh-ed25519 ${KEY}`,
      'unknown',
    ],
    ['another host only', `db.example.com ssh-ed25519 ${KEY}`, 'unknown'],
    [
      'a different key of the same type',
      `bastion.example.com ssh-ed25519 ${OTHER_KEY}`,
      'changed',
    ],
    [
      'a key of another type only',
      `bastion.example.com ecdsa-sha2-nistp256 ${ECDSA_KEY}`,
      'changed',
    ],
    [
      'a changed line before the matching one',
      `bastion.example.com ssh-ed25519 ${OTHER_KEY}\nbastion.example.com ssh-ed25519 ${KEY}`,
      'known',
    ],
    [
      'a revoked key',
      `@revoked * ssh-ed25519 ${KEY}\nbastion.example.com ssh-ed25519 ${KEY}`,
      'revoked',
    ],
    ['a comment', `# bastion.example.com ssh-ed25519 ${KEY}`, 'unknown'],
  ])('reads %s', (_, contents, status) => {
    expect(knownHosts.check(contents, 'bastion.example.com', key)).toBe(status)
  })
})

describe('knownHosts.getName', () => {
  it.each<
    [string, Parameters<typeof knownHosts.getName>[0], string, HostKeyStatus]
  >([
    [
      'a non-default port in brackets',
      { host: 'bastion.example.com', port: 2222 },
      `[bastion.example.com]:2222 ssh-ed25519 ${KEY}`,
      'known',
    ],
    [
      'no default-port entry for another port',
      { host: 'bastion.example.com', port: 2222 },
      `bastion.example.com ssh-ed25519 ${KEY}`,
      'unknown',
    ],
    [
      'a mixed-case host against a hashed entry',
      { host: 'Bastion.Example.COM', port: 22 },
      HASHED_LINE,
      'known',
    ],
    [
      'a HostKeyAlias without its port',
      { alias: 'prod-bastion', host: 'bastion.example.com', port: 2222 },
      `prod-bastion ssh-ed25519 ${KEY}`,
      'known',
    ],
  ])('matches %s', (_, host, contents, status) => {
    expect(knownHosts.check(contents, knownHosts.getName(host), key)).toBe(
      status
    )
  })
})

describe('knownHosts.listedAlgorithms', () => {
  it.each<[string, string, ServerHostKeyAlgorithm | undefined]>([
    ['an unlisted host', `db.example.com ssh-ed25519 ${KEY}`, undefined],
    [
      'a host listed under ecdsa',
      `bastion.example.com ecdsa-sha2-nistp256 ${ECDSA_KEY}`,
      'ecdsa-sha2-nistp256',
    ],
    [
      'a host listed under rsa',
      'bastion.example.com ssh-rsa AAAA',
      'rsa-sha2-512',
    ],
  ])('puts the listed type first for %s', (_, contents, first) => {
    expect(
      knownHosts.listedAlgorithms(contents, 'bastion.example.com')[0]
    ).toBe(first)
  })
})

describe('knownHosts.getLine', () => {
  it.each([false, true])(
    'writes a line it reads back (hashed: %p)',
    (hashed) => {
      const line = knownHosts.getLine('bastion.example.com', key, { hashed })
      expect(line.startsWith('|1|')).toBe(hashed)
      expect(knownHosts.check(line, 'bastion.example.com', key)).toBe('known')
      expect(knownHosts.check(line, 'db.example.com', key)).toBe('unknown')
    }
  )
})
