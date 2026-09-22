import type { WithSchema } from '../../../../types'
import type { InformationSchema } from './information'
import type { System } from './system'

export type Database = WithSchema<InformationSchema, 'information_schema'> &
  WithSchema<System, 'system'>
