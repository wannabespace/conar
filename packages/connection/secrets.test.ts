import { describe, expect, it } from 'bun:test'

import { connectionSecrets } from './secrets'

const LOCAL =
  'postgres://app:db-pass@db.internal:5432/app?sslkey=%2Fkeys%2Fclient.key&sslpassword=key-pass&ssh_host=bastion&ssh_auth=password&ssh_password=ssh-pass'

describe('connectionSecrets', () => {
  it('keeps every secret off the synced string but marks which ones it had', () => {
    const synced = new URL(connectionSecrets.strip(LOCAL))

    expect(synced.password).toBe('')
    expect(synced.searchParams.get('ssh_password')).toBe('')
    expect(synced.searchParams.get('sslpassword')).toBe('')
    expect(connectionSecrets.missing(synced.searchParams)).toEqual([
      'ssh_password',
      'sslpassword',
    ])
  })

  it('restores the stripped secrets from the local copy', () => {
    expect(
      connectionSecrets.restore(connectionSecrets.strip(LOCAL), LOCAL)
    ).toBe(LOCAL)
  })

  it('keeps asking for an SSH secret an edit left empty, only while the tunnel uses it', () => {
    const edited =
      'postgres://app@db.internal:5432/app?ssh_host=bastion&ssh_auth=password'
    const missing = ['ssh_password' as const]
    const switchedToAgent =
      'postgres://app@db.internal:5432/app?ssh_host=bastion&ssh_auth=agent'
    const tunnelOff = 'postgres://app@db.internal:5432/app'

    expect(
      connectionSecrets.missing(
        new URL(connectionSecrets.keepMissing(edited, missing)).searchParams
      )
    ).toEqual(['ssh_password'])
    expect(connectionSecrets.keepMissing(switchedToAgent, missing)).toBe(
      switchedToAgent
    )
    expect(connectionSecrets.keepMissing(tunnelOff, missing)).toBe(tunnelOff)
  })

  it('never restores a secret the synced string dropped', () => {
    const switchedToAgent =
      'postgres://app@db.internal:5432/app?ssh_host=bastion&ssh_auth=agent'
    const restored = new URL(connectionSecrets.restore(switchedToAgent, LOCAL))

    expect(restored.searchParams.has('ssh_password')).toBe(false)
  })
})
