import type { WithSchema } from '../../../utils/types'
import type { InformationSchema } from './information'
import type { Public } from './public'

export type Database = Public
  & WithSchema<InformationSchema, 'information_schema'>
