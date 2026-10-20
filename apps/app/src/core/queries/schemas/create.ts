import { unsupported } from '@tamery/shared/unsupported'
import { sql } from 'kysely'

import { createQuery } from '~/core/runtime/query'

export const createSchemaQuery = (schema: string) =>
  createQuery({
    query: {
      clickhouse: unsupported('Schemas'),
      mssql: (db) => db.schema.createSchema(schema).execute(),
      mysql: (db) => db.schema.createSchema(schema).execute(),
      // NO AUTHENTICATION is 18c and up, so a schema-only user is a locked account with a
      // password nobody knows. Without a quota on the default tablespace, its tables are
      // created but refuse every row.
      oracle: async (db) => {
        const { tablespace } = await db
          .selectFrom('DATABASE_PROPERTIES')
          .select('PROPERTY_VALUE as tablespace')
          .where('PROPERTY_NAME', '=', 'DEFAULT_PERMANENT_TABLESPACE')
          .executeTakeFirstOrThrow()
        const password = crypto.randomUUID().replaceAll('-', '').slice(0, 30)
        await sql`CREATE USER ${sql.id(schema)} IDENTIFIED BY ${sql.id(password)} ACCOUNT LOCK QUOTA UNLIMITED ON ${sql.id(tablespace)}`.execute(
          db
        )
      },
      postgres: (db) => db.schema.createSchema(schema).execute(),
      sqlite: unsupported('Schemas'),
    },
  })
