import { statementQuery } from '../shared/statements'
import type { FunctionShape, RoutineTarget } from './shape'
import { createFunctionStatements, dropRoutineStatements } from './shape'

// replacesObject marks a signature the engine cannot replace in place.
// Dropping loses the routine's grants and owner, so it only happens then.
export const recreateFunctionQuery = ({
  replacesObject,
  shape,
  ...target
}: RoutineTarget & { replacesObject: boolean; shape: FunctionShape }) => {
  const create = createFunctionStatements({
    replace: true,
    schema: target.schema,
    shape,
  })
  const drop = dropRoutineStatements(target)

  return statementQuery('Functions', {
    mssql: [replacesObject ? drop.byName : undefined, create.mssql],
    mysql: [drop.byName, create.mysql],
    postgres: [replacesObject ? drop.postgres : undefined, create.postgres],
  })
}
