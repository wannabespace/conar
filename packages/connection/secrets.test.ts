import { describe, expect, it } from 'bun:test'

import { connectionSecrets } from './secrets'

const LOCAL =
  'postgres://app:db-pass@db.internal:5432/app?sslkey=%2Fkeys%2Fclient.key&sslpassword=key-pass&sslpfx=bundle&ssh_host=bastion&ssh_auth=password&ssh_password=ssh-pass'

describe('connectionSecrets', () => {
  it('keeps every secret off the synced string but marks which ones it had', () => {
    const synced = new URL(connectionSecrets.strip(LOCAL))

    expect(synced.password).toBe('')
    expect(synced.searchParams.get('ssh_password')).toBe('')
    expect(synced.searchParams.get('sslpassword')).toBe('')
    expect(synced.searchParams.get('sslkey')).toBe('/keys/client.key')
    expect(connectionSecrets.missing(synced.searchParams)).toEqual([
      'ssh_password',
      'sslpassword',
      'sslpfx',
    ])
  })

  it('keeps a ClickHouse access token off the synced string', () => {
    const synced = new URL(
      connectionSecrets.strip(
        'https://default@ch.example.com:8443/?access_token=jwt-secret'
      )
    )

    expect(synced.searchParams.get('access_token')).toBe('')
    expect(connectionSecrets.missing(synced.searchParams)).toEqual([
      'access_token',
    ])
  })

  it('copies a string that still connects but carries no tunnel secret', () => {
    const copied = new URL(connectionSecrets.copyable(LOCAL))

    expect(copied.password).toBe('db-pass')
    expect(copied.searchParams.get('sslpassword')).toBe('key-pass')
    expect(copied.searchParams.get('ssh_host')).toBe('bastion')
    expect(copied.searchParams.has('ssh_password')).toBe(false)
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
