import { describe, expect, it } from 'bun:test'

import { ConnectionType } from '@tamery/shared/enums/connection-type'

import type { SshTunnel } from '../ssh/params'
import { guessConnection } from './index'
import type { GuessFormat } from './index'

const PRIVATE_KEY =
  '-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAA+/==\n-----END OPENSSH PRIVATE KEY-----'

const tunnel = (overrides: Partial<SshTunnel>): SshTunnel => ({
  auth: 'agent',
  host: '',
  keyPath: '',
  passphrase: '',
  password: '',
  port: '',
  privateKey: '',
  user: '',
  ...overrides,
})

describe('guessConnection — SSH', () => {
  it('reads the bastion and points the database at the forward target', () => {
    expect(
      guessConnection(
        'ssh -L 5433:db.internal:5432 ubuntu@bastion.acme.io -p 2222 -i ~/.ssh/key.pem'
      )
    ).toStrictEqual({
      fixes: [],
      format: 'ssh',
      parts: {
        engine: ConnectionType.Postgres,
        host: 'db.internal',
        port: '5432',
        ssh: tunnel({
          auth: 'keyPath',
          host: 'bastion.acme.io',
          keyPath: '~/.ssh/key.pem',
          port: '2222',
          user: 'ubuntu',
        }),
      },
    })
  })

  it.each([
    [
      'ssh -N -f -l ubuntu -o Port=2222 bastion.acme.io',
      tunnel({ host: 'bastion.acme.io', port: '2222', user: 'ubuntu' }),
    ],
    [
      'ssh -fNL 127.0.0.1:6000:db.internal:5432 -oUser=ubuntu bastion.acme.io',
      tunnel({ host: 'bastion.acme.io', user: 'ubuntu' }),
    ],
  ])('reads options in %s', (text, ssh) => {
    expect(guessConnection(text)?.parts.ssh).toStrictEqual(ssh)
  })

  it.each<[string, string, GuessFormat]>([
    [
      'a psql command on the forwarded port',
      'ssh -L 5433:db.internal:5432 ubuntu@bastion.acme.io\nPGPASSWORD=pw psql -h localhost -p 5433 -U app -d shop',
      'cli',
    ],
    [
      'a URL on the forwarded port',
      'ssh -L 5433:db.internal:5432 ubuntu@bastion.acme.io\npostgres://app:pw@127.0.0.1:5433/shop',
      'url',
    ],
  ])('merges %s', (_, text, format) => {
    expect(guessConnection(text)).toStrictEqual({
      fixes: [],
      format,
      parts: {
        database: 'shop',
        engine: ConnectionType.Postgres,
        host: 'db.internal',
        password: 'pw',
        port: '5432',
        ssh: tunnel({ host: 'bastion.acme.io', user: 'ubuntu' }),
        user: 'app',
      },
    })
  })

  it('reads a command chained after the ssh command', () => {
    expect(
      guessConnection(
        'ssh -fN -L 5433:db.internal:5432 deploy@bastion.acme.io && psql "host=localhost port=5433 user=app password=pw dbname=shop"'
      )?.parts
    ).toStrictEqual({
      database: 'shop',
      engine: ConnectionType.Postgres,
      host: 'db.internal',
      password: 'pw',
      port: '5432',
      ssh: tunnel({ host: 'bastion.acme.io', user: 'deploy' }),
      user: 'app',
    })
  })

  it('reads a URL chained after the ssh command', () => {
    expect(
      guessConnection(
        'ssh -fN -L 5433:db.internal:5432 deploy@bastion.acme.io; postgres://app:pw@localhost:5433/shop'
      )?.parts
    ).toMatchObject({
      database: 'shop',
      host: 'db.internal',
      password: 'pw',
      user: 'app',
    })
  })

  it('reads variables set before the ssh command', () => {
    expect(
      guessConnection(
        'PGPASSWORD=pw DATABASE_URL=postgres://app@db.internal/shop ssh deploy@bastion.acme.io'
      )?.parts
    ).toMatchObject({
      database: 'shop',
      host: 'db.internal',
      password: 'pw',
      ssh: tunnel({ host: 'bastion.acme.io', user: 'deploy' }),
    })
  })

  it('ignores ssh mentioned in prose', () => {
    expect(
      guessConnection(
        'First ssh into the bastion, then connect to postgres://app:pw@db.internal/shop'
      )?.parts
    ).toStrictEqual({
      database: 'shop',
      engine: ConnectionType.Postgres,
      host: 'db.internal',
      password: 'pw',
      user: 'app',
    })
  })

  it('keeps a database host that is not the local end of a forward', () => {
    expect(
      guessConnection(
        'ssh -L 5433:db.internal:5432 ubuntu@bastion.acme.io\npsql -h db.other -U app'
      )?.parts
    ).toMatchObject({ host: 'db.other' })
  })

  it('uses a pasted private key for the tunnel', () => {
    expect(
      guessConnection(
        `ssh ubuntu@bastion.acme.io -i ~/.ssh/key.pem\n${PRIVATE_KEY}\npostgres://app@db.internal/shop`
      )?.parts.ssh
    ).toStrictEqual(
      tunnel({
        auth: 'key',
        host: 'bastion.acme.io',
        keyPath: '~/.ssh/key.pem',
        privateKey: PRIVATE_KEY,
        user: 'ubuntu',
      })
    )
  })

  it('reads a private key pasted on its own', () => {
    expect(guessConnection(PRIVATE_KEY)).toStrictEqual({
      fixes: [],
      format: 'ssh',
      parts: { ssh: tunnel({ auth: 'key', privateKey: PRIVATE_KEY }) },
    })
  })
})
