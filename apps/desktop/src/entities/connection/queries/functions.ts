import type { connectionsResources } from '~/drizzle/schema'
import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import { sql } from 'kysely'
import { connectionResourceToQueryParams, createQuery } from '../query'

export const functionsType = type({
  'schema': 'string',
  'name': 'string',
  'type': 'string',
  'language?': 'string',
  'return_type': 'string | null',
  'argument_count?': 'number',
}).pipe(({ type: fnType, argument_count, language, ...item }) => ({
  ...item,
  type: fnType as 'function' | 'procedure',
  argumentCount: argument_count || null,
  language: language || null,
}))

export const resourceFunctionsQuery = createQuery({
  type: functionsType.array(),
  query: {
    postgres: db => db
      .selectFrom('pg_catalog.pg_proc as p')
      .innerJoin('pg_catalog.pg_namespace as n', 'p.pronamespace', 'n.oid')
      .innerJoin('pg_catalog.pg_language as l', 'p.prolang', 'l.oid')
      .leftJoin('pg_catalog.pg_type as t', 'p.prorettype', 't.oid')
      .select(({ eb }) => [
        'n.nspname as schema',
        'p.proname as name',
        eb.case('p.prokind')
          .when('f')
          .then('function')
          .when('p')
          .then('procedure')
          .when('a')
          .then('function')
          .when('w')
          .then('function')
          .else('function')
          .end()
          .as('type'),
        'l.lanname as language',
        't.typname as return_type',
        'p.pronargs as argument_count',
      ])
      .where('n.nspname', 'not like', 'pg_%')
      .where('n.nspname', '!=', 'information_schema')
      .where('p.prokind', '!=', 'a')
      .execute(),
    mysql: db => db
      .selectFrom('information_schema.ROUTINES as r')
      .select(({ eb }) => [
        'r.ROUTINE_SCHEMA as schema',
        'r.ROUTINE_NAME as name',
        sql<string>`LOWER(r.ROUTINE_TYPE)`.as('type'),
        eb.case()
          .when('r.ROUTINE_TYPE', '=', 'FUNCTION')
          .then(eb.ref('r.DATA_TYPE'))
          .else(null)
          .end()
          .as('return_type'),
      ])
      .where('r.ROUTINE_SCHEMA', 'not in', ['mysql', 'information_schema', 'performance_schema', 'sys'])
      .execute(),
    mssql: db => db
      .selectFrom('sys.objects as o')
      .innerJoin('sys.schemas as s', 'o.schema_id', 's.schema_id')
      .select(({ eb, or }) => [
        's.name as schema',
        'o.name as name',
        eb.case()
          .when(or([
            eb('o.type', '=', 'FN'),
            eb('o.type', '=', 'IF'),
            eb('o.type', '=', 'TF'),
            eb('o.type', '=', 'FS'),
            eb('o.type', '=', 'FT'),
          ]))
          .then('function')
          .when(or([
            eb('o.type', '=', 'P'),
            eb('o.type', '=', 'PC'),
          ]))
          .then('procedure')
          .else('function')
          .end()
          .as('type'),
        eb.case()
          .when(or([
            eb('o.type', '=', 'FS'),
            eb('o.type', '=', 'FT'),
            eb('o.type', '=', 'PC'),
          ]))
          .then('CLR')
          .else('SQL')
          .end()
          .as('language'),
        eb.case()
          .when('o.type', '=', 'FN')
          .then('scalar')
          .when(or([
            eb('o.type', '=', 'IF'),
            eb('o.type', '=', 'TF'),
          ]))
          .then('table')
          .when('o.type', '=', 'FS')
          .then('CLR scalar')
          .when('o.type', '=', 'FT')
          .then('CLR table')
          .else(null)
          .end()
          .as('return_type'),
      ])
      .where('o.type', 'in', ['FN', 'IF', 'TF', 'FS', 'FT', 'P', 'PC'])
      .where('o.is_ms_shipped', '=', false)
      .where('s.name', 'not in', ['sys', 'INFORMATION_SCHEMA'])
      .execute(),
    clickhouse: () => {
      throw new Error('Clickhouse is not supported')
    },
    duckdb: () => {
      throw new Error('DuckDB is not supported')
    },
  },
})

export function resourceFunctionsQueryOptions({ connectionResource }: { connectionResource: typeof connectionsResources.$inferSelect }) {
  return queryOptions({
    queryFn: () => resourceFunctionsQuery.run(connectionResourceToQueryParams(connectionResource)),
    queryKey: ['connection-resource', connectionResource.id, 'functions'],
  })
}
