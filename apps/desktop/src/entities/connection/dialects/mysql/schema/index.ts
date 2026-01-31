import type { WithSchema } from '../../../utils/types'
import type { InformationSchema } from './information'

import type { PerformanceSchema } from './performance'

export type Database = WithSchema<InformationSchema, 'information_schema'> & WithSchema<PerformanceSchema, 'performance_schema'>
