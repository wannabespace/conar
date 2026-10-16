import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from 'bun:test'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import * as os from 'node:os'
import path from 'node:path'

import { hostKeyTrust } from './host-key'
import type { HostKeyStatus } from './known-hosts'

const KEY_DATA =
  'AAAAC3NzaC1lZDI1NTE5AAAAIA5ZQGz/jkvzkrmq7wh10u7paft8xgs+DXjosBeu7fNZ'
const OTHER_KEY_DATA =
  'AAAAC3NzaC1lZDI1NTE5AAAAIINvYImuUJD0pYs1LbT2zG+TZ9TozGMtt7sepVkItZPM'
const KEY = Buffer.from(KEY_DATA, 'base64')

let home = ''
const knownHostsPath = () => path.join(home, '.ssh', 'known_hosts')

const trust = (name: string, confirm = () => Promise.resolve(true)) =>
  hostKeyTrust.confirm(name, KEY, {
    confirm,
    hashed: false,
    isLive: () => true,
  })

beforeEach(async () => {
  home = await mkdtemp(path.join(os.tmpdir(), 'tamery-host-key-'))
  spyOn(os, 'homedir').mockReturnValue(home)
})

afterEach(async () => {
  mock.restore()
  await rm(home, { force: true, recursive: true })
})

describe('hostKeyTrust', () => {
  it('appends a key the user trusts to known_hosts', async () => {
    expect(await trust('appended.example.com')).toBe(true)
    expect(await readFile(knownHostsPath(), 'utf-8')).toBe(
      `appended.example.com ssh-ed25519 ${KEY_DATA}\n`
    )
  })

  it('asks once for connects to the same host racing each other', async () => {
    const confirm = mock(() => Promise.resolve(true))
    await Promise.all([
      trust('raced.example.com', confirm),
      trust('raced.example.com', confirm),
    ])
    expect(confirm).toHaveBeenCalledTimes(1)
  })

  it('neither writes nor remembers a declined key', async () => {
    expect(
      await trust('declined.example.com', () => Promise.resolve(false))
    ).toBe(false)
    expect(hostKeyTrust.check('', 'declined.example.com', KEY)).toBe('unknown')
    await expect(readFile(knownHostsPath(), 'utf-8')).rejects.toThrow()
  })

  it('remembers a key trusted while known_hosts is read-only, so a reconnect does not ask again', async () => {
    await mkdir(path.dirname(knownHostsPath()))
    await writeFile(knownHostsPath(), '', { mode: 0o400 })
    expect(await trust('readonly.example.com')).toBe(true)
    expect(hostKeyTrust.check('', 'readonly.example.com', KEY)).toBe('known')
  })

  it.each<[string, string, HostKeyStatus]>([
    ['changed', `refused.example.com ssh-ed25519 ${OTHER_KEY_DATA}`, 'changed'],
    ['revoked', `@revoked * ssh-ed25519 ${KEY_DATA}`, 'revoked'],
  ])(
    'still refuses a key trusted this run once known_hosts lists it as %s',
    async (_, known, status) => {
      await trust('refused.example.com')
      expect(hostKeyTrust.check(known, 'refused.example.com', KEY)).toBe(status)
    }
  )
})
