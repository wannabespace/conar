import type { WithSchema } from '../../../utils/types'
import type { InformationSchema } from './information'

export type Database = WithSchema<InformationSchema, 'information_schema'>
