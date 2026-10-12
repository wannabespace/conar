import { describe, expect, it } from 'bun:test'

import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { guessConnection } from './index'

const PARTS = {
  database: 'app',
  host: 'db.acme.io',
  password: 'pw',
  port: '5432',
  type: ConnectionType.Postgres,
  user: 'me',
}

describe('guessConnection — JSON', () => {
  it.each([
    [
      'Knex',
      '{ "client": "pg", "connection": { "host": "db.acme.io", "port": 5432, "user": "me", "password": "pw", "database": "app" } }',
    ],
    [
      'TypeORM',
      '{ "type": "postgres", "host": "db.acme.io", "port": 5432, "username": "me", "password": "pw", "database": "app" }',
    ],
    [
      'Sequelize',
      '{ "dialect": "postgres", "host": "db.acme.io", "port": "5432", "username": "me", "password": "pw", "database": "app" }',
    ],
  ])('reads a %s config', (_, text) => {
    const guess = guessConnection(text)
    expect(guess?.format).toBe('json')
    expect(guess?.parts).toStrictEqual(PARTS)
  })

  it('reads a JavaScript object literal pasted from a config file', () => {
    expect(
      guessConnection(`{
  client: 'mysql2',
  connection: {
    host: 'db.acme.io',
    port: 3306,
    user: 'me',
    password: 'pw',
    database: 'shop',
  },
}`)?.parts
    ).toStrictEqual({
      database: 'shop',
      host: 'db.acme.io',
      password: 'pw',
      port: '3306',
      type: ConnectionType.MySQL,
      user: 'me',
    })
  })

  it.each([
    [
      'an AWS Secrets Manager RDS secret',
      '{"username":"me","password":"pw","engine":"postgres","host":"db.acme.io","port":5432,"dbname":"app","dbInstanceIdentifier":"prod"}',
    ],
    [
      'a URL inside a config',
      '{ "connectionString": "postgres://me:pw@db.acme.io:5432/app", "ssl": { "rejectUnauthorized": false } }',
    ],
    [
      'an array of connections (VS Code SQLTools)',
      '{"sqltools.connections": [{"name":"prod","driver":"PostgreSQL","server":"db.acme.io","port":5432,"database":"app","username":"me","password":"pw"}]}',
    ],
    [
      'camelCase keys under an engine-named parent',
      '{"postgres": {"hostName":"db.acme.io","port":5432,"databaseName":"app","userName":"me","password":"pw"}}',
    ],
  ])('reads %s', (_, text) => {
    expect(guessConnection(text)?.parts).toStrictEqual(PARTS)
  })

  it('reads the connection DBeaver stores, without the credentials it keeps elsewhere', () => {
    expect(
      guessConnection(
        '{"connections":{"postgres-jdbc-1":{"provider":"postgresql","name":"app","configuration":{"host":"db.acme.io","port":"5432","database":"app","type":"dev"}}}}'
      )?.parts
    ).toStrictEqual({
      database: 'app',
      host: 'db.acme.io',
      port: '5432',
      type: ConnectionType.Postgres,
    })
  })

  it('reads a module export, skipping values it would have to evaluate', () => {
    expect(
      guessConnection(`module.exports = {
  client: 'pg',
  // primary
  connection: { host: 'db.acme.io', port: 5432, user: 'me', password: process.env.DB_PASSWORD, database: 'app' },
};`)?.parts
    ).toStrictEqual({
      database: 'app',
      host: 'db.acme.io',
      port: '5432',
      type: ConnectionType.Postgres,
      user: 'me',
    })
  })

  it('reads KEY=value items of an env array (docker inspect)', () => {
    expect(
      guessConnection(
        '[{"Config": {"Env": ["POSTGRES_USER=me", "POSTGRES_PASSWORD=pw", "POSTGRES_DB=app", "PATH=/usr/bin"]}}]'
      )?.parts
    ).toStrictEqual({
      database: 'app',
      password: 'pw',
      type: ConnectionType.Postgres,
      user: 'me',
    })
  })
})
