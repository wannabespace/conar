import { unsupported } from '@tamery/shared/utils/unsupported'
import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import { sql } from 'kysely'

import type { ConnectionResource } from '../../core/sync'
import {
  connectionResourceToQueryParams,
  createQuery,
} from '../../runtime/query'

export const functionsType = type({
  'args?': 'string | null',
  'argument_count?': 'number',
  'behavior?': 'string | null',
  'body?': 'string | null',
  'extras?': 'string | null',
  'identity?': 'string',
  'language?': 'string',
  name: 'string',
  'oid?': 'number',
  return_type: 'string | null',
  schema: 'string',
  'security_definer?': 'boolean',
  type: 'string',
}).pipe(
  ({
    type: fnType,
    args,
    argument_count,
    behavior,
    body,
    extras,
    language,
    security_definer,
    ...item
  }) => ({
    ...item,
    args: args || '',
    argumentCount: argument_count || null,
    behavior: behavior || '',
    body: body || '',
    extras: extras || '',
    language: language || null,
    securityDefiner: security_definer ?? false,
    type: fnType as 'function' | 'procedure',
  })
)

const resourceFunctionsQuery = createQuery({
  query: {
    clickhouse: unsupported('Functions'),
    mssql: (db) =>
      db
        .selectFrom('sys.objects as o')
        .innerJoin('sys.schemas as s', 'o.schema_id', 's.schema_id')
        .leftJoin('sys.sql_modules as sm', 'o.object_id', 'sm.object_id')
        .select(({ eb, or }) => [
          's.name as schema',
          'o.name as name',
          sql<string>`(
            SELECT STRING_AGG(CONCAT(pa.name, ' ', TYPE_NAME(pa.user_type_id)), ', ')
              WITHIN GROUP (ORDER BY pa.parameter_id)
            FROM sys.parameters pa
            WHERE pa.object_id = o.object_id AND pa.parameter_id > 0
          )`.as('args'),
          // The catalog keeps the whole CREATE, so the body is what follows
          // the AS that closes the header.
          sql<string>`STUFF(sm.definition, 1, CHARINDEX(' AS ', sm.definition) + 3, '')`.as(
            'body'
          ),
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
            .then(
              sql<string>`(
                SELECT TYPE_NAME(pa.user_type_id)
                FROM sys.parameters pa
                WHERE pa.object_id = o.object_id AND pa.parameter_id = 0
              )`
            )
            .when(or([eb('o.type', '=', 'IF'), eb('o.type', '=', 'TF')]))
            // oxlint-disable-next-line promise/prefer-await-to-then -- Kysely CASE builder, not a Promise
            .then('table')
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
          sql<string>`(
            SELECT GROUP_CONCAT(
              CONCAT_WS(' ', NULLIF(pm.PARAMETER_MODE, 'IN'), pm.PARAMETER_NAME, pm.DTD_IDENTIFIER)
              ORDER BY pm.ORDINAL_POSITION SEPARATOR ', '
            )
            FROM information_schema.PARAMETERS pm
            WHERE pm.SPECIFIC_SCHEMA = r.ROUTINE_SCHEMA
              AND pm.SPECIFIC_NAME = r.ROUTINE_NAME
              AND pm.ORDINAL_POSITION > 0
          )`.as('args'),
          'r.ROUTINE_DEFINITION as body',
          sql<string>`CASE WHEN r.IS_DETERMINISTIC = 'YES' THEN 'DETERMINISTIC' ELSE 'NOT DETERMINISTIC' END`.as(
            'behavior'
          ),
          sql<string>`CONCAT_WS(' ', r.SQL_DATA_ACCESS, CONCAT('SQL SECURITY ', r.SECURITY_TYPE))`.as(
            'extras'
          ),
          eb
            .case()
            .when('r.ROUTINE_TYPE', '=', 'FUNCTION')
            // oxlint-disable-next-line promise/prefer-await-to-then -- Kysely CASE builder, not a Promise
            .then(eb.ref('r.DTD_IDENTIFIER'))
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
        .select(({ eb }) => [
          'n.nspname as schema',
          'p.proname as name',
          eb
            .case('p.prokind')
            .when('p')
            // oxlint-disable-next-line promise/prefer-await-to-then -- Kysely CASE builder, not a Promise
            .then('procedure')
            .else('function')
            .end()
            .as('type'),
          'l.lanname as language',
          sql<string>`pg_get_function_result(p.oid)`.as('return_type'),
          sql<string>`pg_get_function_arguments(p.oid)`.as('args'),
          'p.prosrc as body',
          'p.prosecdef as security_definer',
          sql<string>`CASE p.provolatile WHEN 'i' THEN 'IMMUTABLE' WHEN 's' THEN 'STABLE' ELSE 'VOLATILE' END`.as(
            'behavior'
          ),
          sql<string>`TRIM(CONCAT_WS(' ',
            CASE WHEN p.proisstrict THEN 'STRICT' END,
            CASE WHEN p.proleakproof THEN 'LEAKPROOF' END,
            CASE p.proparallel WHEN 's' THEN 'PARALLEL SAFE' WHEN 'r' THEN 'PARALLEL RESTRICTED' END,
            CONCAT('COST ', p.procost::text),
            CASE WHEN p.proretset THEN CONCAT('ROWS ', p.prorows::text) END,
            (
              SELECT string_agg(
                CONCAT('SET ', split_part(cfg, '=', 1), ' TO ', quote_literal(substr(cfg, strpos(cfg, '=') + 1))),
                ' '
              )
              FROM unnest(COALESCE(p.proconfig, '{}')) AS cfg
            )
          ))`.as('extras'),
          'p.pronargs as argument_count',
          'p.oid as oid',
          sql<string>`pg_get_function_identity_arguments(p.oid)`.as('identity'),
        ])
        .where('n.nspname', 'not like', 'pg_%')
        .where('n.nspname', '!=', 'information_schema')
        .where('p.prokind', '!=', 'a')
        .where(
          sql<boolean>`NOT EXISTS (SELECT 1 FROM pg_catalog.pg_depend d WHERE d.classid = 'pg_catalog.pg_proc'::regclass AND d.objid = p.oid AND d.deptype = 'e')`
        )
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
