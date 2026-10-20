import type { Kysely } from 'kysely'

import { userSchemas } from '~/core/queries/shared/oracle-catalog'
import type { Database as OracleDatabase } from '~/core/runtime/dialects/oracle/schema'

export const oracleTriggers = (db: Kysely<OracleDatabase>) =>
  db
    .selectFrom('ALL_TRIGGERS as t')
    .select((eb) => [
      't.OWNER as schema',
      't.TABLE_NAME as table',
      't.TRIGGER_NAME as name',
      't.TRIGGERING_EVENT as event',
      eb
        .case()
        .when('t.TRIGGER_TYPE', 'like', 'BEFORE%')
        .then('BEFORE')
        .when('t.TRIGGER_TYPE', 'like', 'AFTER%')
        .then('AFTER')
        .else(eb.ref('t.TRIGGER_TYPE'))
        .end()
        .as('timing'),
      eb
        .case()
        .when(
          eb.or([
            eb('t.TRIGGER_TYPE', 'like', '%EACH ROW'),
            eb('t.TRIGGER_TYPE', '=', 'INSTEAD OF'),
          ])
        )
        .then('ROW')
        .else('STATEMENT')
        .end()
        .as('orientation'),
      't.TRIGGER_BODY as body',
      eb
        .case()
        .when('t.STATUS', '=', 'ENABLED')
        .then(1)
        .else(0)
        .end()
        .as('enabled'),
      eb
        .case()
        .when(
          eb.or([
            eb('t.TRIGGER_TYPE', '=', 'COMPOUND'),
            eb('t.ACTION_TYPE', 'like', 'CALL%'),
            eb('t.WHEN_CLAUSE', 'is not', null),
            eb(
              't.REFERENCING_NAMES',
              '!=',
              'REFERENCING NEW AS NEW OLD AS OLD'
            ),
            eb('t.TABLE_OWNER', '!=', eb.ref('t.OWNER')),
            eb.exists(
              eb
                .selectFrom('ALL_TRIGGER_COLS as c')
                .select('c.COLUMN_NAME')
                .whereRef('c.TRIGGER_OWNER', '=', 't.OWNER')
                .whereRef('c.TRIGGER_NAME', '=', 't.TRIGGER_NAME')
                .where('c.COLUMN_LIST', '=', 'YES')
            ),
            eb.exists(
              eb
                .selectFrom('ALL_TRIGGER_ORDERING as o')
                .select('o.ORDERING_TYPE')
                .whereRef('o.TRIGGER_OWNER', '=', 't.OWNER')
                .whereRef('o.TRIGGER_NAME', '=', 't.TRIGGER_NAME')
            ),
          ])
        )
        .then(1)
        .else(0)
        .end()
        .as('custom'),
    ])
    .$narrowType<{ custom: 1 | 0; enabled: 1 | 0; table: string }>()
    .where('t.BASE_OBJECT_TYPE', 'in', ['TABLE', 'VIEW'])
    .where('t.TABLE_NAME', 'not like', 'BIN$%')
    .where('t.OWNER', 'in', userSchemas(db))
    .execute()
