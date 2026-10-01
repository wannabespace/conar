import type { WithSchema } from '~/core/connection/types'

import type { InformationSchema } from './information'
import type { Sys } from './sys'

export type Database = WithSchema<InformationSchema, 'information_schema'> &
  WithSchema<Sys, 'sys'>
