import { unsupported } from '@tamery/shared/unsupported'
import { sql } from 'kysely'

import { createQuery } from '~/core/runtime/query'

export const createSchemaQuery = (schema: string) =>
  createQuery({
    query: {
      clickhouse: unsupported('Schemas'),
      mssql: (db) => db.schema.createSchema(schema).execute(),
      mysql: (db) => db.schema.createSchema(schema).execute(),
      // Without a quota on the default tablespace, its tables are created but refuse every row.
      oracle: async (db) => {
        const { tablespace } = await db
          .selectFrom('DATABASE_PROPERTIES')
          .select('PROPERTY_VALUE as tablespace')
          .where('PROPERTY_NAME', '=', 'DEFAULT_PERMANENT_TABLESPACE')
          .executeTakeFirstOrThrow()
        await sql`CREATE USER ${sql.id(schema)} NO AUTHENTICATION QUOTA UNLIMITED ON ${sql.id(tablespace)}`.execute(
          db
        )
      },
      postgres: (db) => db.schema.createSchema(schema).execute(),
      sqlite: unsupported('Schemas'),
    },
  })
