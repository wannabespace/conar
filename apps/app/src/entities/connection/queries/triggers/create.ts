import { statementQuery } from '../shared/statements'
import type { TriggerShape, TriggerTarget } from './shape'
import { createTriggerStatements } from './shape'

export const createTriggerQuery = (
  params: TriggerTarget & { shape: TriggerShape }
) => statementQuery('Triggers', createTriggerStatements(params))
