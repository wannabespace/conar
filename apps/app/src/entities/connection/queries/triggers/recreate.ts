import { statementQuery } from '../shared/statements'
import type { TriggerShape, TriggerTarget } from './shape'
import {
  createTriggerStatements,
  dropTriggerStatements,
  setTriggerEnabledStatements,
} from './shape'

export const recreateTriggerQuery = ({
  enabled,
  mode,
  name,
  schema,
  shape,
  table,
}: TriggerTarget & {
  enabled: boolean | null
  mode: string
  name: string
  shape: TriggerShape
}) => {
  const drop = dropTriggerStatements({ name, schema, table })
  const create = createTriggerStatements({ schema, shape, table })
  // A created trigger fires on the origin; one that did not comes back as it was.
  const restore =
    enabled === false || mode === 'R' || mode === 'A'
      ? setTriggerEnabledStatements({
          enabled: enabled !== false,
          mode,
          name: shape.name,
          schema,
          table,
        })
      : undefined

  return statementQuery('Triggers', {
    mssql: [drop.mssql, create.mssql, restore?.mssql],
    mysql: [drop.mysql, create.mysql],
    postgres: [drop.postgres, create.postgres, restore?.postgres],
  })
}
