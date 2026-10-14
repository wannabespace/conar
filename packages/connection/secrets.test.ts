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

  it('strips a secret pasted in any case', () => {
    const synced = new URL(
      connectionSecrets.strip(
        'postgres://app@db.internal/app?sslPassword=key-pass&SSH_PASSWORD=ssh-pass'
      )
    )

    expect(connectionSecrets.missing(synced.searchParams)).toEqual([
      'ssh_password',
      'sslpassword',
    ])
  })

  it('restores the stripped secrets from the local copy', () => {
    expect(
      connectionSecrets.restore(connectionSecrets.strip(LOCAL), {
        isPasswordExists: true,
        local: LOCAL,
      })
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

  it('never restores a password another device removed', () => {
    const restored = new URL(
      connectionSecrets.restore(connectionSecrets.strip(LOCAL), {
        isPasswordExists: false,
        local: LOCAL,
      })
    )

    expect(restored.password).toBe('')
  })

  it('never restores a secret the synced string dropped', () => {
    const switchedToAgent =
      'postgres://app@db.internal:5432/app?ssh_host=bastion&ssh_auth=agent'
    const restored = new URL(
      connectionSecrets.restore(switchedToAgent, {
        isPasswordExists: true,
        local: LOCAL,
      })
    )

    expect(restored.searchParams.has('ssh_password')).toBe(false)
  })
})
