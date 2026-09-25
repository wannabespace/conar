import { silently } from '@tamery/shared/utils'
import type { Type } from 'arktype'
import type { Kysely } from 'kysely'
import { CompiledQuery } from 'kysely'

import { createQuery } from '../../runtime/query'
import type { ResultSet } from './custom'
import { resultSetsType } from './custom'

export const transactionQuery = ({
  commit,
  statements,
}: {
  commit: boolean
  statements: string[]
}) => {
  const compiled = statements.map((statement) => CompiledQuery.raw(statement))

  const run = async <DB>(db: Kysely<DB>) => {
    const trx = await db.startTransaction().execute()
    try {
      const sets: ResultSet[] = []
      for (const query of compiled) {
        // Sequential by design: the statements run in order inside one transaction.
        // oxlint-disable-next-line no-await-in-loop
        sets.push(...resultSetsType.assert(await trx.executeQuery(query)))
      }
      await (commit ? trx.commit() : trx.rollback()).execute()
      return sets
    } catch (error) {
      await silently(() => trx.rollback().execute())
      throw error
    }
  }

  return {
    ...createQuery<Type<ResultSet[]>>({
      query: { clickhouse: run, mssql: run, mysql: run, postgres: run },
    }),
    queryIds: compiled.map((query) => query.queryId.queryId),
  }
}
