import { describe, expect, it } from 'bun:test'

import { ConnectionType } from '@tamery/shared/enums/connection-type'

import type { ConnectionParts } from './connection-parts'
import { diagnoseConnectionError } from './diagnose'
import { diagnosisRequestOf } from './diagnosis-request'
import { SSH_TUNNEL_ERROR } from './ssh/params'

const parts = (overrides: Partial<ConnectionParts>): ConnectionParts => ({
  database: '',
  host: 'db.acme.io',
  https: null,
  options: '',
  password: 'pw',
  port: '',
  ssh: null,
  type: ConnectionType.Postgres,
  user: 'me',
  ...overrides,
})

const diagnose = (message: string, overrides: Partial<ConnectionParts> = {}) =>
  diagnoseConnectionError({ desktop: true, message, parts: parts(overrides) })

describe('diagnoseConnectionError', () => {
  it.each([
    'SSH authentication failed. Check the SSH user and credentials.',
    "Can't reach the SSH host: ENOTFOUND",
    'Timed out reaching the SSH host',
  ])('blames the tunnel, not the database, for %s', (message) => {
    expect(
      diagnose(`${SSH_TUNNEL_ERROR}${message}`, { password: '' })
    ).toStrictEqual({
      hint: message,
      title: "Couldn't open the SSH tunnel",
    })
  })

  it('reads a channel the bastion could not open as a database error', () => {
    expect(
      diagnose('(SSH) Channel open failure: Connection refused')?.title
    ).toBe('Connection refused')
  })

  it('points a Docker service name at localhost', () => {
    expect(
      diagnose('getaddrinfo ENOTFOUND postgres', { host: 'postgres' })?.fix
    ).toStrictEqual({
      label: 'Use localhost',
      patch: { host: 'localhost' },
    })
  })

  it('asks for the empty password a remote server will want next', () => {
    expect(
      diagnose('connect EHOSTUNREACH 2a05::1:5432', { password: '' })?.focus
    ).toBe('password')
    expect(
      diagnose('connect ECONNREFUSED 127.0.0.1:5432', {
        host: 'localhost',
        password: '',
      })?.focus
    ).toBeUndefined()
  })

  it('offers a tunnel for a private host that times out', () => {
    expect(
      diagnose('connect ETIMEDOUT 10.0.3.4:5432', { host: '10.0.3.4' })?.fix
        ?.patch
    ).toStrictEqual({
      sshEnabled: true,
    })
  })

  it("turns on SSL in the engine's own option, keeping the others", () => {
    expect(
      diagnose(
        'no pg_hba.conf entry for host "1.2.3.4", user "me", database "app", no encryption',
        {
          options: 'application_name=tamery',
        }
      )?.fix?.patch
    ).toStrictEqual({ options: 'application_name=tamery&sslmode=require' })
  })

  it.each([
    [
      ConnectionType.Postgres,
      'sslmode=require&SSLRootCert=/ca.pem&sslkey=/k.pem&connect_timeout=5',
      'connect_timeout=5&sslmode=disable',
    ],
    [
      ConnectionType.MySQL,
      'ssl=true&sslca=/ca.pem&sslrejectunauthorized=true',
      'ssl=false',
    ],
  ])(
    'turns off SSL on %s without the TLS options the driver refuses beside it',
    (type, options, fixed) => {
      expect(
        diagnose('The server does not support SSL connections', {
          options,
          type,
        })?.fix?.patch
      ).toStrictEqual({ options: fixed })
    }
  )

  it('skips the SQL Server certificate check under the key the driver reads', () => {
    expect(
      diagnose('self-signed certificate in certificate chain', {
        options: 'encrypt=true&TrustServerCertificate=false',
        type: ConnectionType.MSSQL,
      })?.fix?.patch
    ).toStrictEqual({ options: 'encrypt=true&trustservercertificate=true' })
  })

  it('switches the engine when the port belongs to another one', () => {
    expect(
      diagnose('connect ECONNREFUSED 1.2.3.4:3306', { port: '3306' })?.fix
        ?.patch
    ).toStrictEqual({
      type: ConnectionType.MySQL,
    })
  })

  it("names the missing database and falls back to the server's default", () => {
    const diagnosis = diagnose('database "shop" does not exist')
    expect(diagnosis?.title).toBe('Database "shop" doesn\'t exist')
    expect(diagnosis?.fix?.patch).toStrictEqual({ database: '' })
  })

  it('asks for the project ref in a Supabase pooler user', () => {
    expect(
      diagnose('password authentication failed for user "postgres"', {
        host: 'aws-0-eu-central-1.pooler.supabase.com',
        user: 'postgres',
      })?.focus
    ).toBe('user')
  })

  it("asks for the password node-postgres won't send empty", () => {
    expect(
      diagnose(
        'SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string',
        { password: '' }
      )
    ).toMatchObject({
      focus: 'password',
      title: 'This server needs a password',
    })
  })

  it('returns nothing for an error it does not know', () => {
    expect(diagnose('something odd happened')).toBeNull()
  })
})

const request = (message: string, overrides: Partial<ConnectionParts> = {}) =>
  diagnosisRequestOf({ desktop: false, message, parts: parts(overrides) })

describe('diagnosisRequestOf', () => {
  it('carries no address, user or secret option value', () => {
    expect(
      request('password authentication failed for user "me"', {
        options: 'sslmode=require&sslpassword=hunter2',
      })
    ).toStrictEqual({
      error: 'password authentication failed for user "<user>"',
      hostKind: 'public host',
      options: 'sslmode=require&sslpassword=%3Credacted%3E',
      passwordSet: true,
      port: '5432',
      runtime: 'web',
      sshEnabled: false,
      type: ConnectionType.Postgres,
      userSet: true,
    })
  })

  it.each([
    [
      'password authentication failed for user "me" at db.acme.io/app',
      'password authentication failed for user "<user>" at <host>/<database>',
    ],
    [
      'no pg_hba.conf entry for host "2a02:810d:4b3f:e300::1f", user "me"',
      'no pg_hba.conf entry for host "<ip>", user "<user>"',
    ],
    [
      "Access denied for user 'root'@'2001:db8::5' (using password: YES)",
      "Access denied for user 'root'@'<ip>' (using password: YES)",
    ],
    [
      'connect ECONNREFUSED [fe80::1%en0]:5432, then 10.0.0.7:5432',
      'connect ECONNREFUSED [<ip>]:5432, then <ip>:5432',
    ],
    [
      'connect ETIMEDOUT ::ffff:192.0.2.1:5432',
      'connect ETIMEDOUT ::ffff:<ip>:5432',
    ],
  ])('redacts %s', (message, error) => {
    expect(request(message, { database: 'app' }).error).toBe(error)
  })

  it('keeps only option values that name nothing', () => {
    expect(
      request('timeout', {
        options:
          'sslmode=verify-full&connect_timeout=10&ssl=true&sslservername=prod.internal&application_name=billing',
      }).options
    ).toBe(
      'sslmode=verify-full&connect_timeout=10&ssl=true&sslservername=%3Credacted%3E&application_name=%3Credacted%3E'
    )
  })

  it.each([
    ['db.abcd.supabase.co', 'Supabase direct host (IPv6-only)'],
    ['ep-x.eu-central-1.aws.neon.tech', 'Neon public host'],
    ['postgres', 'single-label name (Docker service?)'],
    ['10.0.0.7', 'private network'],
  ])('names the kind of %s without the address', (host, hostKind) => {
    expect(request('timeout', { host }).hostKind).toBe(hostKind)
  })

  it('redacts a secret option whatever its value looks like', () => {
    expect(
      request('timeout', {
        options: 'SSLPassword=123456&ssh_passphrase=true&sslMode=require',
      }).options
    ).toBe(
      'SSLPassword=%3Credacted%3E&ssh_passphrase=%3Credacted%3E&sslMode=require'
    )
  })
})
