import type { Dialect } from '@tamery/shared/enums/connection-type'
import { dialects } from '@tamery/sql'

export const suggestedName = (dialect: Dialect, parts: string[]) => {
  const name = parts.join('_')
  return dialects[dialect].nameCase === 'upper' ? name.toUpperCase() : name
}
