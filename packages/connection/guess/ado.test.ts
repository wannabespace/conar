import { describe, expect, it } from 'bun:test'

import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { guessConnection } from './index'

describe('guessConnection — ADO.NET', () => {
  it.each([
    [
      'Server=tcp:acme.database.windows.net,1433;Initial Catalog=db;User ID=u;Password=p;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;',
      {
        database: 'db',
        host: 'acme.database.windows.net',
        options: 'encrypt=true&trustservercertificate=false',
        password: 'p',
        port: '1433',
        type: ConnectionType.MSSQL,
        user: 'u',
      },
    ],
    [
      'Data Source=mssql.local\\SQLEXPRESS;Database=app;UID=sa;PWD="p;w";Encrypt=Optional;TrustServerCertificate=yes',
      {
        database: 'app',
        host: 'mssql.local',
        options: 'encrypt=false&trustservercertificate=true',
        password: 'p;w',
        type: ConnectionType.MSSQL,
        user: 'sa',
      },
    ],
    [
      'Server=mysql.local;Port=3306;Database=shop;Uid=root;Pwd=pw;',
      {
        database: 'shop',
        host: 'mysql.local',
        password: 'pw',
        port: '3306',
        type: ConnectionType.MySQL,
        user: 'root',
      },
    ],
    [
      'Server=aws.connect.psdb.cloud;Database=shop;Uid=u;Pwd=p;SslMode=VerifyFull',
      {
        database: 'shop',
        host: 'aws.connect.psdb.cloud',
        password: 'p',
        type: ConnectionType.MySQL,
        user: 'u',
      },
    ],
  ])('reads %s', (text, parts) => {
    const guess = guessConnection(text)
    expect(guess?.format).toBe('ado')
    expect(guess?.parts).toStrictEqual(parts)
  })
})
