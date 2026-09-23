import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { sql } from 'kysely'

import { mysqlDefiner } from '../shared/sql-fragments'

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

export const triggerBodyTemplates: Partial<Record<ConnectionType, string>> = {
  mssql: 'BEGIN\n  SET NOCOUNT ON;\nEND',
  mysql: 'BEGIN\n\nEND',
}

// Postgres has no INSTEAD OF TRUNCATE, so a timing pick prunes the events.
export const triggerEventsFor = (
  timing: TriggerTiming,
  events: readonly TriggerEvent[]
) =>
  events.filter((event) => !(timing === 'INSTEAD OF' && event === 'TRUNCATE'))

// Postgres refuses FOR EACH ROW on TRUNCATE and anything but ROW on INSTEAD OF.
export const triggerOrientationsFor = (
  { events, timing }: Pick<TriggerShape, 'events' | 'timing'>,
  allowed: readonly TriggerOrientation[]
) => {
  if (timing === 'INSTEAD OF') {
    return allowed.filter((orientation) => orientation === 'ROW')
  }

  return events.includes('TRUNCATE')
    ? allowed.filter((orientation) => orientation === 'STATEMENT')
    : allowed
}

export interface TriggerTarget {
  schema: string
  table: string
}

export const createTriggerStatements = ({
  definer,
  schema,
  shape,
  table,
}: TriggerTarget & { definer?: string; shape: TriggerShape }) => {
  const target = sql.id(schema, table)
  const name = sql.id(schema, shape.name)
  const timing = sql.raw(shape.timing)
  const events = sql.raw(shape.events.join(', '))
  const body = sql.raw(shape.body)

  return {
    mssql: sql`CREATE TRIGGER ${name} ON ${target} ${timing} ${events} AS ${body}`,
    mysql: sql`CREATE ${mysqlDefiner(definer)} TRIGGER ${name} ${timing} ${events} ON ${target} FOR EACH ROW ${body}`,
    postgres: sql`
      CREATE TRIGGER ${sql.id(shape.name)} ${timing} ${sql.raw(shape.events.join(' OR '))} ON ${target}
      FOR EACH ${sql.raw(shape.orientation)}
      EXECUTE FUNCTION ${sql.id(shape.functionSchema || schema, shape.functionName)}()
    `,
  }
}

export const dropTriggerStatements = ({
  name,
  schema,
  table,
}: TriggerTarget & { name: string }) => {
  const drop = sql`DROP TRIGGER ${sql.id(schema, name)}`

  return {
    mssql: drop,
    mysql: drop,
    postgres: sql`DROP TRIGGER ${sql.id(name)} ON ${sql.id(schema, table)}`,
  }
}

// Postgres remembers whether a trigger fires on the origin, on a replica or
// always; a plain ENABLE would quietly move a replica trigger to the origin.
const postgresEnableVerb = (enabled: boolean, mode: string) => {
  if (!enabled) {
    return sql`DISABLE`
  }

  return { A: sql`ENABLE ALWAYS`, R: sql`ENABLE REPLICA` }[mode] ?? sql`ENABLE`
}

export const setTriggerEnabledStatements = ({
  enabled,
  mode,
  name,
  schema,
  table,
}: TriggerTarget & { enabled: boolean; mode: string; name: string }) => ({
  mssql: sql`${enabled ? sql`ENABLE` : sql`DISABLE`} TRIGGER ${sql.id(schema, name)} ON ${sql.id(schema, table)}`,
  postgres: sql`ALTER TABLE ${sql.id(schema, table)} ${postgresEnableVerb(enabled, mode)} TRIGGER ${sql.id(name)}`,
})
