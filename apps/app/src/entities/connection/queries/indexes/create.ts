import { sqlEngines, statementQuery } from '../shared/statements'
import type { IndexShape } from './shape'
import { createIndexStatement } from './shape'

export const createIndexQuery = (shape: IndexShape) =>
  statementQuery('Creating indexes', sqlEngines(createIndexStatement(shape)))
