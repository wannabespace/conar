import type { DatabaseType } from '@connnect/shared/enums/database-type'
import type { z } from 'zod'
import type { Database } from '~/lib/indexeddb'
import { databaseContextSchema } from '@connnect/shared/database'
import { toast } from 'sonner'
import { indexedDb } from '~/lib/indexeddb'
import { trpc } from '~/lib/trpc'
import { queryClient } from '~/main'
import { databaseQuery } from './hooks/database'
import { databaseSchemasQuery, databaseTablesQuery } from './hooks/queries'

const DATABASES_SCHEMAS_KEY = 'databases-schemas'

export const databaseSchemas = {
  get(id: string) {
    const value = JSON.parse(localStorage.getItem(DATABASES_SCHEMAS_KEY) ?? '{}')

    if (!value[id])
      return 'public'

    return value[id]
  },
  set(id: string, schema: string) {
    const schemas = JSON.parse(localStorage.getItem(DATABASES_SCHEMAS_KEY) ?? '{}')

    schemas[id] = schema

    localStorage.setItem(DATABASES_SCHEMAS_KEY, JSON.stringify(schemas))
  },
}

export async function fetchDatabases() {
  try {
    const [fetchedDatabases, existingDatabases] = await Promise.all([
      trpc.databases.list.query(),
      indexedDb.databases.toArray(),
    ])
    const existingMap = new Map(existingDatabases.map(d => [d.id, d]))
    const fetchedMap = new Map(fetchedDatabases.map(d => [d.id, d]))

    await Promise.all([
      indexedDb.databases.bulkDelete(
        existingDatabases
          .filter(d => !fetchedMap.has(d.id))
          .map(d => d.id),
      ),
      indexedDb.databases.bulkAdd(
        fetchedDatabases
          .filter(d => !existingMap.has(d.id))
          .map(d => ({
            ...d,
            isPasswordPopulated: !!new URL(d.connectionString).password,
          })),
      ),
      indexedDb.databases.bulkUpdate(
        fetchedDatabases
          .filter((d) => {
            const existing = existingMap.get(d.id)

            return existing && (
              existing.name !== d.name
              || existing.connectionString !== d.connectionString
            )
          })
          .map(d => ({
            key: d.id,
            changes: d,
          })),
      ),
    ])
  }
  catch {
    toast.error('Failed to fetch databases. Please try again later.')
  }
}

export async function createDatabase({ saveInCloud, ...database }: {
  name: string
  type: DatabaseType
  connectionString: string
  saveInCloud: boolean
}) {
  const url = new URL(database.connectionString)

  const isPasswordExists = !!url.password

  if (isPasswordExists && !saveInCloud) {
    url.password = ''
  }

  const { id } = await trpc.databases.create.mutate({
    ...database,
    connectionString: url.toString(),
    isPasswordExists,
  })

  await indexedDb.databases.add({
    ...database,
    id,
    isPasswordExists,
    isPasswordPopulated: isPasswordExists,
    createdAt: new Date(),
  })

  return { id }
}

export async function removeDatabase(id: string) {
  await Promise.all([
    trpc.databases.remove.mutate({ id }),
    indexedDb.databases.delete(id),
  ])
}

export async function updateDatabasePassword(id: string, password: string) {
  const database = await indexedDb.databases.get(id)

  if (!database) {
    throw new Error('Database not found')
  }

  const url = new URL(database.connectionString)

  url.password = password
  database.connectionString = url.toString()
  database.isPasswordPopulated = true

  await indexedDb.databases.put(database)
}

export function prefetchDatabaseCore(database: Database) {
  queryClient.ensureQueryData(databaseQuery(database.id))
  queryClient.ensureQueryData(databaseSchemasQuery(database))
  queryClient.ensureQueryData(databaseTablesQuery(database, databaseSchemas.get(database.id)))
}

export async function getDatabaseContext(database: Database): Promise<z.infer<typeof databaseContextSchema>> {
  // Just vibe code
  const results = await window.electron.databases.query({
    type: database.type,
    connectionString: database.connectionString,
    query: `
    SELECT json_build_object(
      'schemas', (
        SELECT json_agg(json_build_object(
          'schema', schemas.nspname,
          'tables', (
            SELECT json_agg(json_build_object(
              'name', tables.relname,
              'columns', (
                SELECT json_agg(json_build_object(
                  'name', columns.attname,
                  'type', pg_catalog.format_type(columns.atttypid, columns.atttypmod),
                  'nullable', NOT columns.attnotnull,
                  'default', pg_get_expr(defaults.adbin, defaults.adrelid)
                ))
                FROM pg_catalog.pg_attribute columns
                LEFT JOIN pg_catalog.pg_attrdef defaults
                  ON defaults.adrelid = columns.attrelid AND defaults.adnum = columns.attnum
                WHERE columns.attrelid = tables.oid
                  AND columns.attnum > 0
                  AND NOT columns.attisdropped
              )
            ))
            FROM pg_catalog.pg_class tables
            WHERE tables.relnamespace = schemas.oid
              AND tables.relkind = 'r'
          )
        ))
        FROM pg_catalog.pg_namespace schemas
        WHERE schemas.nspname NOT IN ('pg_catalog', 'information_schema')
          AND schemas.nspname NOT LIKE 'pg_toast%'
          AND schemas.nspname NOT LIKE 'pg_temp%'
      ),
      'enums', (
        SELECT json_agg(json_build_object(
          'schema', enum_schemas.nspname,
          'name', enum_types.typname,
          'value', enum_labels.enumlabel
        ))
        FROM pg_type enum_types
        JOIN pg_enum enum_labels ON enum_types.oid = enum_labels.enumtypid
        JOIN pg_catalog.pg_namespace enum_schemas ON enum_schemas.oid = enum_types.typnamespace
        WHERE enum_schemas.nspname NOT IN ('pg_catalog', 'information_schema')
      )
    ) AS database_context;`,
  })

  const [result] = results
  const { database_context } = result.rows[0] as { database_context: z.infer<typeof databaseContextSchema> }

  return databaseContextSchema.parseAsync(database_context)
}
