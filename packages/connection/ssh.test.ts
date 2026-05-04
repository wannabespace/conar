import { Buffer } from 'node:buffer'
import { describe, expect, it } from 'bun:test'
import { parseSshConfig, SSH_SECRET_PARAMS } from './ssh'
import { readSshKey } from './ssh-server'

describe('parseSshConfig', () => {
  it('returns null when ssh_host is missing', () => {
    expect(parseSshConfig(new URLSearchParams())).toBeNull()
  })

  it('returns null when ssh_host is empty', () => {
    expect(parseSshConfig(new URLSearchParams('ssh_host='))).toBeNull()
  })

  it('parses every field', () => {
    const params = new URLSearchParams({
      ssh_host: 'bastion.example.com',
      ssh_port: '2222',
      ssh_user: 'alice',
      ssh_auth: 'password',
      ssh_password: 'pw',
      ssh_private_key: 'a2V5',
      ssh_private_key_path: '/tmp/id_rsa',
      ssh_passphrase: 'pass',
    })

    expect(parseSshConfig(params)).toEqual({
      host: 'bastion.example.com',
      port: 2222,
      user: 'alice',
      auth: 'password',
      password: 'pw',
      privateKey: 'a2V5',
      privateKeyPath: '/tmp/id_rsa',
      passphrase: 'pass',
    })
  })

  it('defaults ssh_port to 22 and ssh_auth to "key"', () => {
    const cfg = parseSshConfig(new URLSearchParams({
      ssh_host: 'bastion',
      ssh_user: 'alice',
    }))
    expect(cfg?.port).toBe(22)
    expect(cfg?.auth).toBe('key')
  })

  it('falls back to "key" for unknown auth values', () => {
    const cfg = parseSshConfig(new URLSearchParams({
      ssh_host: 'bastion',
      ssh_auth: 'rubbish',
    }))
    expect(cfg?.auth).toBe('key')
  })
})

describe('readSshKey', () => {
  it('decodes a base64-encoded inline private key', () => {
    const buf = readSshKey({
      host: 'h',
      port: 22,
      user: 'u',
      auth: 'key',
      privateKey: Buffer.from('SECRET-KEY').toString('base64'),
    })
    expect(buf?.toString()).toBe('SECRET-KEY')
  })

  it('returns undefined when no key material is provided', () => {
    expect(readSshKey({
      host: 'h',
      port: 22,
      user: 'u',
      auth: 'key',
    })).toBeUndefined()
  })
})

describe('SSH_SECRET_PARAMS', () => {
  it('lists the three secret parameter names', () => {
    expect([...SSH_SECRET_PARAMS]).toEqual([
      'ssh_password',
      'ssh_private_key',
      'ssh_passphrase',
    ])
  })
})
