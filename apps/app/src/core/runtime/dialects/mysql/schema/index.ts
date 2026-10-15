import type { WithSchema } from '~/core/connection/types'

import type { InformationSchema } from './information'
import type { PerformanceSchema } from './performance'

export type Database = WithSchema<InformationSchema, 'information_schema'> &
  WithSchema<PerformanceSchema, 'performance_schema'>

/** Only after `version()` says MariaDB, through `db.withTables<MariadbTables>()`: MySQL fails the whole statement on a name it lacks. */
export type MariadbTables = WithSchema<
  { CHECK_CONSTRAINTS: { TABLE_NAME: string } },
  'information_schema'
>
