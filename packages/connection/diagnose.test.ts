import { describe, expect, it } from 'bun:test'

import { ConnectionType } from '@tamery/shared/enums/connection-type'

import type { ConnectionParts } from './connection-parts'
import {
  diagnoseConnectionError,
  diagnosisRequestOf,
  redactConnectionError,
} from './diagnose'

const parts = (overrides: Partial<ConnectionParts>): ConnectionParts => ({
  database: '',
  host: 'db.acme.io',
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
  it('points a Docker service name at localhost', () => {
    expect(
      diagnose('getaddrinfo ENOTFOUND postgres', { host: 'postgres' })?.fix
    ).toStrictEqual({
      label: 'Use localhost',
      patch: { host: 'localhost' },
    })
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

  it('returns nothing for an error it does not know', () => {
    expect(diagnose('something odd happened')).toBeNull()
  })
})

describe('redactConnectionError', () => {
  it('replaces every identifying value, longest first', () => {
    expect(
      redactConnectionError(
        'password authentication failed for user "me" at db.acme.io/app',
        parts({ database: 'app' })
      )
    ).toBe(
      'password authentication failed for user "<user>" at <host>/<database>'
    )
  })
})

describe('diagnosisRequestOf', () => {
  it('carries no address, user or secret option value', () => {
    expect(
      diagnosisRequestOf({
        desktop: false,
        message: 'password authentication failed for user "me"',
        parts: parts({ options: 'sslmode=require&sslpassword=hunter2' }),
      })
    ).toStrictEqual({
      error: 'password authentication failed for user "<user>"',
      hostKind: 'public host',
      options: 'sslmode=require&sslpassword=%3Credacted%3E',
      passwordSet: true,
      port: '5432',
      runtime: 'web',
      sshEnabled: false,
      userSet: true,
    })
  })
})
