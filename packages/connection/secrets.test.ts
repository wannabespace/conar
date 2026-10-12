import { describe, expect, it } from 'bun:test'

import { connectionSecrets } from './secrets'
import { sshSecrets } from './ssh/params'

const LOCAL =
  'postgres://app:db-pass@db.internal:5432/app?ssh_host=bastion&ssh_auth=password&ssh_password=ssh-pass'

describe('connectionSecrets', () => {
  it('keeps every secret off the synced string but marks which ones it had', () => {
    const synced = new URL(connectionSecrets.strip(LOCAL))

    expect(synced.password).toBe('')
    expect(synced.searchParams.get('ssh_password')).toBe('')
    expect(sshSecrets.missing(synced.searchParams)).toEqual(['password'])
  })

  it('restores the stripped secrets from the local copy', () => {
    expect(
      connectionSecrets.restore(connectionSecrets.strip(LOCAL), LOCAL)
    ).toBe(LOCAL)
  })

  it('never restores a secret the synced string dropped', () => {
    const switchedToAgent =
      'postgres://app@db.internal:5432/app?ssh_host=bastion&ssh_auth=agent'
    const restored = new URL(connectionSecrets.restore(switchedToAgent, LOCAL))

    expect(restored.searchParams.has('ssh_password')).toBe(false)
  })
})
