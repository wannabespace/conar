import { statementQuery } from '../shared/statements'
import type { TriggerTarget } from './shape'
import { dropTriggerStatements } from './shape'

export const dropTriggerQuery = (params: TriggerTarget & { name: string }) =>
  statementQuery('Triggers', dropTriggerStatements(params))
