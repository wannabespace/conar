import { PGlite } from '@electric-sql/pglite'
import { live } from '@electric-sql/pglite/live'
import { drizzle } from 'drizzle-orm/pglite'
import migrations from './migrations.json'
import * as chats from './schema/chats'
import * as databases from './schema/databases'
import * as queries from './schema/queries'

export * from './schema/chats'
export * from './schema/databases'
export * from './schema/queries'

// eslint-disable-next-line antfu/no-top-level-await
export const pg = await PGlite.create('idb://conar', {
  extensions: {
    live,
  },
})

if (import.meta.env.DEV) {
  // @ts-expect-error - window.db is not typed
  window.db = pg
}

export const db = drizzle({
  client: pg,
  casing: 'snake_case',
  logger: import.meta.env.DEV,
  schema: {
    ...databases,
    ...chats,
    ...queries,
  },
})

export async function clearDb() {
  await db.transaction(async (tx) => {
    await Promise.all([
      tx.delete(databases.databases),
      tx.delete(chats.chats),
    ])
  })
}

async function ensureMigrationsTable() {
  await db.execute('CREATE SCHEMA IF NOT EXISTS drizzle')
  await db.execute(`CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
    id SERIAL PRIMARY KEY,
    hash text NOT NULL,
    created_at bigint
  )`)
}

async function getMigratedHashes() {
  const result = await db.execute(`SELECT hash FROM drizzle.__drizzle_migrations ORDER BY created_at ASC`)
  return result.rows.map(row => row.hash as string)
}

async function recordMigration(hash: string) {
  await db.execute(`
    INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
    VALUES ('${hash}', ${Date.now()})
    ON CONFLICT DO NOTHING
  `)
}

export async function runMigrations() {
  console.log('🚀 Starting pglite migrations...')

  await ensureMigrationsTable()

  const executedHashes = await getMigratedHashes()
  const pendingMigrations = migrations.filter(migration => !executedHashes.includes(migration.hash))

  if (pendingMigrations.length === 0) {
    console.info('✨ No pending migrations found.')
    return
  }

  console.info(`📦 Found ${pendingMigrations.length} pending migrations`)

  for (const migration of pendingMigrations) {
    console.info(`⚡ Executing migration: ${migration.hash}`)

    try {
      for (const sql of migration.sql) {
        await db.execute(sql)
      }

      await recordMigration(migration.hash)
      console.info(`✅ Successfully completed migration: ${migration.hash}`)
    }
    catch (error) {
      console.error(`❌ Failed to execute migration ${migration.hash}:`, error)
      throw error
    }
  }

  console.info('🎉 All migrations completed successfully')
}
