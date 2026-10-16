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

/** SQLite keeps only the CREATE TRIGGER text, so timing, event and body are read back from it; a trigger without a timing fires BEFORE. */
export const sqliteTriggerParts = (statement: string) => {
  const tokens = tokenize(statement, dialects[Dialect.SQLite]).tokens.filter(
    (token) => token.kind !== 'comment'
  )
  const words = tokens.map((token) =>
    token.quoted ? null : token.text.toUpperCase()
  )
  let index = words.indexOf('TRIGGER') + 1
  if (words[index] === 'IF') {
    index += 3
  }
  index += words[index + 1] === '.' ? 3 : 1
  let timing = 'BEFORE'
  if (words[index] === 'INSTEAD') {
    timing = 'INSTEAD OF'
    index += 2
  } else if (words[index] === 'BEFORE' || words[index] === 'AFTER') {
    timing = words[index] ?? timing
    index += 1
  }
  const event = words[index]
  if (!event) {
    throw new Error(`No trigger event in ${statement}`)
  }
  const begin = words.indexOf('BEGIN', index)
  const header = words.slice(index + 1, begin)

  return {
    body: statement.slice(tokens[begin]?.start),
    custom: header[0] === 'OF' || header.includes('WHEN'),
    event,
    timing,
  }
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
  postgres: sql`ALTER TABLE ${sql.id(schema, table)} ${postgresEnableVerb(enabled, mode)} TRIGGER ${sql.id(name)}`,
})
