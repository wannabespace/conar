import type { ConnectionType } from '@tamery/shared/enums/connection-type'

import type { ConnectionResource } from '~/core/connection/sync'
import { distinctQuery } from '~/core/queries/rows/distinct'
import { insertQuery } from '~/core/queries/rows/insert'
import {
  connectionResourceToQueryParams,
  transaction,
} from '~/core/runtime/query'
import type { Column } from '~/core/table/cell/utils'

import { generateRows, insertBatchSize } from '.'
import type { Generator } from './registry'
import { REFERENCE_GENERATOR, SKIP_GENERATOR } from './types'

export const insertSeedRows = async ({
  columnGenerators,
  columns,
  connectionResource,
  count,
  dialect,
  schema,
  table,
}: {
  columnGenerators: Record<string, Generator>
  columns: Column[]
  connectionResource: ConnectionResource
  count: number
  dialect: ConnectionType
  schema: string
  table: string
}) => {
  const queryParams = await connectionResourceToQueryParams(connectionResource)

  const referenceData = Object.fromEntries(
    await Promise.all(
      columns.flatMap(({ foreign, id }) =>
        foreign && columnGenerators[id]?.generatorId === REFERENCE_GENERATOR
          ? [
              distinctQuery({
                column: foreign.column,
                schema: foreign.schema,
                table: foreign.table,
              })
                .run(queryParams)
                .then(
                  (rows) =>
                    [id, rows.map((row) => row[foreign.column])] as const
                ),
            ]
          : []
      )
    )
  )

  const rows = generateRows({
    columnGenerators,
    columns,
    count,
    dialect,
    referenceData,
  })
  const insertedColumnCount = Object.values(columnGenerators).filter(
    (generator) => generator.generatorId !== SKIP_GENERATOR
  ).length
  const batchSize = insertBatchSize(dialect, insertedColumnCount)

  await transaction(queryParams).execute(async (tx) => {
    for (let index = 0; index < rows.length; index += batchSize) {
      // oxlint-disable-next-line no-await-in-loop -- batches share one transaction connection
      await insertQuery({
        columns,
        rows: rows.slice(index, index + batchSize),
        schema,
        table,
      }).run(queryParams, tx)
    }
  })
}
