import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import { sql } from 'kysely'

import type { ConnectionResource } from '../core/sync'
import { connectionResourceToQueryParams, createQuery } from '../runtime/query'

export const functionsType = type({
  'argument_count?': 'number',
  'language?': 'string',
  name: 'string',
  return_type: 'string | null',
  schema: 'string',
  type: 'string',
}).pipe(({ type: fnType, argument_count, language, ...item }) => ({
  ...item,
  argumentCount: argument_count || null,
  language: language || null,
  type: fnType as 'function' | 'procedure',
}))

const resourceFunctionsQuery = createQuery({
  query: {
    clickhouse: () => {
      throw new Error('Clickhouse is not supported')
    },
    mssql: (db) =>
      db
        .selectFrom('sys.objects as o')
        .innerJoin('sys.schemas as s', 'o.schema_id', 's.schema_id')
        .select(({ eb, or }) => [
          's.name as schema',
          'o.name as name',
          eb
            .case()
            .when(
              or([
                eb('o.type', '=', 'FN'),
                eb('o.type', '=', 'IF'),
                eb('o.type', '=', 'TF'),
                eb('o.type', '=', 'FS'),
                eb('o.type', '=', 'FT'),
              ])
            )
            // oxlint-disable-next-line promise/prefer-await-to-then -- Kysely CASE builder, not a Promise
            .then('function')
            .when(or([eb('o.type', '=', 'P'), eb('o.type', '=', 'PC')]))
            // oxlint-disable-next-line promise/prefer-await-to-then -- Kysely CASE builder, not a Promise
            .then('procedure')
            .else('function')
            .end()
            .as('type'),
          eb
            .case()
            .when(
              or([
                eb('o.type', '=', 'FS'),
                eb('o.type', '=', 'FT'),
                eb('o.type', '=', 'PC'),
              ])
            )
            // oxlint-disable-next-line promise/prefer-await-to-then -- Kysely CASE builder, not a Promise
            .then('CLR')
            .else('SQL')
            .end()
            .as('language'),
          eb
            .case()
            .when('o.type', '=', 'FN')
            // oxlint-disable-next-line promise/prefer-await-to-then -- Kysely CASE builder, not a Promise
            .then('scalar')
            .when(or([eb('o.type', '=', 'IF'), eb('o.type', '=', 'TF')]))
            // oxlint-disable-next-line promise/prefer-await-to-then -- Kysely CASE builder, not a Promise
            .then('table')
            .when('o.type', '=', 'FS')
            // oxlint-disable-next-line promise/prefer-await-to-then -- Kysely CASE builder, not a Promise
            .then('CLR scalar')
            .when('o.type', '=', 'FT')
            // oxlint-disable-next-line promise/prefer-await-to-then -- Kysely CASE builder, not a Promise
            .then('CLR table')
            .else(null)
            .end()
            .as('return_type'),
        ])
        .where('o.type', 'in', ['FN', 'IF', 'TF', 'FS', 'FT', 'P', 'PC'])
        .where('o.is_ms_shipped', '=', false)
        .where('s.name', 'not in', ['sys', 'INFORMATION_SCHEMA'])
        .execute(),
    mysql: (db) =>
      db
        .selectFrom('information_schema.ROUTINES as r')
        .select(({ eb }) => [
          'r.ROUTINE_SCHEMA as schema',
          'r.ROUTINE_NAME as name',
          sql<string>`LOWER(r.ROUTINE_TYPE)`.as('type'),
          eb
            .case()
            .when('r.ROUTINE_TYPE', '=', 'FUNCTION')
            // oxlint-disable-next-line promise/prefer-await-to-then -- Kysely CASE builder, not a Promise
            .then(eb.ref('r.DATA_TYPE'))
            .else(null)
            .end()
            .as('return_type'),
        ])
        .where('r.ROUTINE_SCHEMA', 'not in', [
          'mysql',
          'information_schema',
          'performance_schema',
          'sys',
        ])
        .execute(),
    postgres: (db) =>
      db
        .selectFrom('pg_catalog.pg_proc as p')
        .innerJoin('pg_catalog.pg_namespace as n', 'p.pronamespace', 'n.oid')
        .innerJoin('pg_catalog.pg_language as l', 'p.prolang', 'l.oid')
        .leftJoin('pg_catalog.pg_type as t', 'p.prorettype', 't.oid')
        .select(({ eb }) => [
          'n.nspname as schema',
          'p.proname as name',
          eb
            .case('p.prokind')
            .when('f')
            // oxlint-disable-next-line promise/prefer-await-to-then -- Kysely CASE builder, not a Promise
            .then('function')
            .when('p')
            // oxlint-disable-next-line promise/prefer-await-to-then -- Kysely CASE builder, not a Promise
            .then('procedure')
            .when('a')
            // oxlint-disable-next-line promise/prefer-await-to-then -- Kysely CASE builder, not a Promise
            .then('function')
            .when('w')
            // oxlint-disable-next-line promise/prefer-await-to-then -- Kysely CASE builder, not a Promise
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
  },
  type: functionsType.array(),
})

export const resourceFunctionsQueryOptions = ({
  connectionResource,
}: {
  connectionResource: ConnectionResource
}) =>
  queryOptions({
    queryFn: async () =>
      resourceFunctionsQuery.run(
        await connectionResourceToQueryParams(connectionResource)
      ),
    queryKey: ['connection-resource', connectionResource.id, 'functions'],
  })
