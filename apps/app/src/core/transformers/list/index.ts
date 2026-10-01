import type { ConnectionType } from '@tamery/shared/enums/connection-type'

import type { Column } from '~/core/table/cell/utils'
import type { ValueTransformer } from '~/core/transformers/value-transformer'

import { createClickHouseListTransformer } from './clickhouse'
import { createMysqlListTransformer } from './mysql'
import { createPostgresListTransformer } from './postgres'

const listTransformers: Partial<
  // oxlint-disable-next-line ts/no-explicit-any
  Record<ConnectionType, (column: Column) => ValueTransformer<any>>
> = {
  clickhouse: createClickHouseListTransformer,
  mysql: createMysqlListTransformer,
  postgres: createPostgresListTransformer,
}

export const createListTransformer = (
  connectionType: ConnectionType,
  column: Column
  // oxlint-disable-next-line ts/no-explicit-any
): ValueTransformer<any> => {
  const factory = listTransformers[connectionType]
  return factory ? factory(column) : createPostgresListTransformer(column)
}
