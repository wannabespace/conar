import { Dialect } from '@tamery/shared/enums/connection-type'
import { dialects, tokenize } from '@tamery/sql'
import { sql } from 'kysely'

import { mysqlDefiner } from '~/core/queries/shared/sql-fragments'

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

export const triggerBodyTemplates: Partial<Record<Dialect, string>> = {
  mssql: 'BEGIN\n  SET NOCOUNT ON;\nEND',
  mysql: 'BEGIN\n\nEND',
  oracle: 'BEGIN\n  NULL;\nEND;',
  sqlite: 'BEGIN\n\nEND',
}

export const triggerEventsFor = (
  timing: TriggerTiming,
  events: readonly TriggerEvent[]
) =>
  events.filter((event) => !(timing === 'INSTEAD OF' && event === 'TRUNCATE'))

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

const SQLITE_TRIGGER_EVENTS = new Set(['DELETE', 'INSERT', 'UPDATE'])

const TIMING_BEFORE_EVENT: Record<string, TriggerTiming> = {
  AFTER: 'AFTER',
  OF: 'INSTEAD OF',
}

// Trigger events are reserved words, so the first unquoted one is the event and the timing sits right before it.
export const sqliteTriggerParts = (statement: string) => {
  const tokens = tokenize(statement, dialects[Dialect.SQLite]).tokens.filter(
    (token) => token.kind !== 'comment'
  )
  const words = tokens.map((token) =>
    token.quoted ? '' : token.text.toUpperCase()
  )
  const at = words.findIndex((word) => SQLITE_TRIGGER_EVENTS.has(word))
  const event = words[at]
  if (!event) {
    throw new Error(`No trigger event in ${statement}`)
  }
  const begin = words.indexOf('BEGIN', at)
  const header = words.slice(at + 1, begin)

  return {
    body: statement.slice(tokens[begin]?.start),
    custom: header[0] === 'OF' || header.includes('WHEN'),
    event,
    timing: TIMING_BEFORE_EVENT[words[at - 1] ?? ''] ?? 'BEFORE',
  }
}

export interface TriggerTarget {
  schema: string
  table: string
}

export const createTriggerStatements = ({
  definer,
  replace = false,
  schema,
  shape,
  table,
}: TriggerTarget & {
  definer?: string
  replace?: boolean
  shape: TriggerShape
}) => {
  const target = sql.id(schema, table)
  const name = sql.id(schema, shape.name)
  const timing = sql.raw(shape.timing)
  const events = sql.raw(shape.events.join(', '))
  const body = sql.raw(shape.body)

  return {
    mssql: sql`CREATE TRIGGER ${name} ON ${target} ${timing} ${events} AS ${body}`,
    mysql: sql`CREATE ${mysqlDefiner(definer)} TRIGGER ${name} ${timing} ${events} ON ${target} FOR EACH ROW ${body}`,
    oracle: sql`${replace ? sql`CREATE OR REPLACE` : sql`CREATE`} TRIGGER ${name} ${timing} ${sql.raw(shape.events.join(' OR '))} ON ${target}${shape.orientation === 'ROW' ? sql` FOR EACH ROW` : sql``}
${body}`,
    postgres: sql`
      CREATE TRIGGER ${sql.id(shape.name)} ${timing} ${sql.raw(shape.events.join(' OR '))} ON ${target}
      FOR EACH ${sql.raw(shape.orientation)}
      EXECUTE FUNCTION ${sql.id(shape.functionSchema || schema, shape.functionName)}()
    `,
    // SQLite refuses a qualified table here: the trigger's own schema names it.
    sqlite: sql`CREATE TRIGGER ${name} ${timing} ${events} ON ${sql.id(table)} FOR EACH ROW ${body}`,
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
    oracle: drop,
    postgres: sql`DROP TRIGGER ${sql.id(name)} ON ${sql.id(schema, table)}`,
    sqlite: drop,
  }
}

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
  oracle: sql`ALTER TRIGGER ${sql.id(schema, name)} ${enabled ? sql`ENABLE` : sql`DISABLE`}`,
  postgres: sql`ALTER TABLE ${sql.id(schema, table)} ${postgresEnableVerb(enabled, mode)} TRIGGER ${sql.id(name)}`,
})
