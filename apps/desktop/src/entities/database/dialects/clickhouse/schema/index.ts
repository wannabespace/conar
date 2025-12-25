import type { WithSchema } from '../../../utils/types'
import type { InformationSchema } from './information'
import type { SystemSchema } from './system'

export type Database = WithSchema<InformationSchema, 'information_schema'> & WithSchema<SystemSchema, 'system'>
