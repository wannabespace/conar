import { statementQuery } from '../shared/statements'
import type { TriggerTarget } from './shape'
import { setTriggerEnabledStatements } from './shape'

export const setTriggerEnabledQuery = (
  params: TriggerTarget & { enabled: boolean; mode: string; name: string }
) => statementQuery('Disabling triggers', setTriggerEnabledStatements(params))
