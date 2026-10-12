import { describe, expect, it } from 'bun:test'

import type { HostKeyStatus } from './known-hosts'
import { knownHosts } from './known-hosts'

const KEY =
  'AAAAC3NzaC1lZDI1NTE5AAAAIA5ZQGz/jkvzkrmq7wh10u7paft8xgs+DXjosBeu7fNZ'
const OTHER_KEY =
  'AAAAC3NzaC1lZDI1NTE5AAAAIINvYImuUJD0pYs1LbT2zG+TZ9TozGMtt7sepVkItZPM'
// `ssh-keygen -H` of `bastion.example.com ssh-ed25519 <KEY>`
const HASHED_LINE = `|1|Fwo54sDnpLmOfgRmRM5QESILxsE=|Cq0kDhB0/5f1yQWlJZakVEY3OpA= ssh-ed25519 ${KEY}`

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

  it('names a non-default port the way OpenSSH writes it', () => {
    const name = knownHosts.nameOf('bastion.example.com', 2222)
    expect(
      knownHosts.check(
        `[bastion.example.com]:2222 ssh-ed25519 ${KEY}`,
        name,
        key
      )
    ).toBe('known')
    expect(
      knownHosts.check(`bastion.example.com ssh-ed25519 ${KEY}`, name, key)
    ).toBe('unknown')
  })
})
