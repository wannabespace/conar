import { sql } from 'kysely'

export type RoutineKind = 'function' | 'procedure'

export const routineKeyword = (kind: RoutineKind) =>
  sql.raw(kind === 'procedure' ? 'PROCEDURE' : 'FUNCTION')
