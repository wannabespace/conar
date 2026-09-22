import { statementQuery } from '../shared/statements'
import type { FunctionShape } from './shape'
import { createFunctionStatements } from './shape'

export const createFunctionQuery = ({
  schema,
  shape,
}: {
  schema: string
  shape: FunctionShape
}) =>
  statementQuery(
    'Functions',
    createFunctionStatements({ replace: false, schema, shape })
  )
