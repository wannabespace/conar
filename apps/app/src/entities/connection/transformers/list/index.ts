import type { ConnectionType } from '@tamery/shared/enums/connection-type'

import type { Column } from '../../components'
import type { ValueTransformer } from '../create-transformer'
import { createClickHouseListTransformer } from './clickhouse'
import { createMysqlListTransformer } from './mysql'
import { createPostgresListTransformer } from './postgres'

// oxlint-disable-next-line ts/no-explicit-any
const listTransformers: Partial<Record<ConnectionType, (column: Column) => ValueTransformer<any>>> =
  {
    postgres: createPostgresListTransformer,
    mysql: createMysqlListTransformer,
    clickhouse: createClickHouseListTransformer,
  }

export function createListTransformer(
  connectionType: ConnectionType,
  column: Column,
  // oxlint-disable-next-line ts/no-explicit-any
): ValueTransformer<any> {
  const factory = listTransformers[connectionType]
  return factory ? factory(column) : createPostgresListTransformer(column)
}
