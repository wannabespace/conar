import { sql } from 'kysely'

export const TRIGGER_EVENTS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'TRUNCATE',
] as const
export const TRIGGER_ORIENTATIONS = ['ROW', 'STATEMENT'] as const
export const TRIGGER_TIMINGS = ['BEFORE', 'AFTER', 'INSTEAD OF'] as const

export type TriggerEvent = (typeof TRIGGER_EVENTS)[number]
export type TriggerOrientation = (typeof TRIGGER_ORIENTATIONS)[number]
export type TriggerTiming = (typeof TRIGGER_TIMINGS)[number]

export interface TriggerShape {
  body: string
  events: TriggerEvent[]
  functionName: string
  functionSchema: string
  name: string
  orientation: TriggerOrientation
  timing: TriggerTiming
}

export interface TriggerTarget {
  schema: string
  table: string
}

export const dropTriggerStatements = ({
  name,
  schema,
  table,
}: TriggerTarget & { name: string }) => {
  const dropByName = sql`DROP TRIGGER ${sql.id(schema, name)}`

  return {
    mssql: dropByName,
    mysql: dropByName,
    postgres: sql`DROP TRIGGER ${sql.id(name)} ON ${sql.id(schema, table)}`,
  }
}

// Postgres remembers whether a trigger fires on the origin, on a replica or
// always; a plain ENABLE would quietly move a replica trigger to the origin.
const postgresEnableVerb = (enabled: boolean, mode: string) => {
  if (!enabled) {
    return 'DISABLE'
  }

  return { A: 'ENABLE ALWAYS', R: 'ENABLE REPLICA' }[mode] ?? 'ENABLE'
}

export const setTriggerEnabledStatements = ({
  enabled,
  mode,
  name,
  schema,
  table,
}: TriggerTarget & { enabled: boolean; mode: string; name: string }) => ({
  mssql: sql`${sql.raw(enabled ? 'ENABLE' : 'DISABLE')} TRIGGER ${sql.id(schema, name)} ON ${sql.id(schema, table)}`,
  postgres: sql`ALTER TABLE ${sql.id(schema, table)} ${sql.raw(postgresEnableVerb(enabled, mode))} TRIGGER ${sql.id(name)}`,
})

export const createTriggerStatements = ({
  schema,
  shape,
  table,
}: TriggerTarget & { shape: TriggerShape }) => {
  const target = sql.id(schema, table)
  const name = sql.id(schema, shape.name)
  const timing = sql.raw(shape.timing)
  const body = sql.raw(shape.body)
  const events = (separator: string) => sql.raw(shape.events.join(separator))

  return {
    mssql: sql`CREATE TRIGGER ${name} ON ${target} ${timing} ${events(', ')} AS ${body}`,
    mysql: sql`CREATE TRIGGER ${name} ${timing} ${events(', ')} ON ${target} FOR EACH ROW ${body}`,
    postgres: sql`CREATE TRIGGER ${sql.id(shape.name)} ${timing} ${events(' OR ')} ON ${target} FOR EACH ${sql.raw(shape.orientation)} EXECUTE FUNCTION ${sql.id(shape.functionSchema || schema, shape.functionName)}()`,
  }
}
