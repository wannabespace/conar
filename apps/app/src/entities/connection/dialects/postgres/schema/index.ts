import type { WithSchema } from '../../../utils/types'
import type { PgCatalog } from './catalog'
import type { InformationSchema } from './information'
import type { Public } from './public'

export type Database = Public
  & WithSchema<PgCatalog, 'pg_catalog'>
  & WithSchema<InformationSchema, 'information_schema'>
