/* eslint-disable no-console */
// import PGWorker from './worker?worker'
import { PGlite } from '@electric-sql/pglite'
// import { PGliteWorker } from '@electric-sql/pglite/worker'
import { drizzle } from 'drizzle-orm/pglite'
import { createStore } from 'seitu'
import migrations from './migrations.json'
import { chatsRelations } from './schema/chats'
import { connections } from './schema/connections'
import { queriesRelations } from './schema/queries'

// const pg = new PGliteWorker(new PGWorker({ name: 'pglite-worker' }))
const pg = new PGlite('idb://conar')

if (import.meta.env.DEV) {
  // @ts-expect-error - window.db is not typed
  window.db = pg
  // @ts-expect-error - window.dbQuery is not typed
  window.dbQuery = q => pg.query(q).then((r) => {
    console.table(r.rows)
    return r.rows
  })
}

export const db = drizzle({
  client: pg,
  casing: 'snake_case',
  logger: import.meta.env.DEV,
  relations: {
    ...chatsRelations,
    ...queriesRelations,
  },
})

export async function clearDb() {
  // We can remove just connections because other tables are related to connections
  await db.delete(connections)
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

const { promise, resolve } = Promise.withResolvers()

export async function waitForMigrations() {
  await promise
}

export const migrationsState = createStore<'idle' | 'running' | 'completed' | 'failed'>('idle')

export async function runMigrations() {
  migrationsState.set('running')

  try {
    console.log('🚀 Starting pglite migrations...')

    await ensureMigrationsTable()

    const executedHashes = await getMigratedHashes()
    const pendingMigrations = migrations.filter(migration => !executedHashes.includes(migration.hash))

    if (pendingMigrations.length === 0) {
      console.info('✨ No pending migrations found.')
      migrationsState.set('completed')
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
    migrationsState.set('completed')
  }
  catch (error) {
    migrationsState.set('failed')
    throw error
  }
  finally {
    resolve()
  }
}
