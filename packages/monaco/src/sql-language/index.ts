import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { dialects } from '@tamery/sql'
import type { IDisposable } from 'monaco-editor'

import { registerCompletion } from './completion'
import { registerGhostText } from './ghost-text'
import { registerLanguage, sqlLanguageIds } from './language'

export { attachSqlDiagnostics } from './diagnostics'
export {
  acceptGhostText,
  attachGhostTextEscape,
  dismissGhostText,
  GHOST_TEXT_SELECTOR,
} from './ghost-text'
export { sqlLanguageIds } from './language'
export type { SqlSource, TableRef } from './source'
export { bindSqlModel, catalogSummaryFor, EMPTY_CATALOG } from './source'

const registerSqlLanguage = (connectionType: ConnectionType) => {
  const id = sqlLanguageIds[connectionType]
  const dialect = dialects[connectionType]
  return [
    ...registerLanguage(id, dialect),
    registerCompletion(id, dialect),
    registerGhostText(id, dialect),
  ]
}

declare global {
  // Monaco is a singleton the whole page shares; the providers registered by an earlier evaluation of
  // this module (a hot reload) must go, or every suggestion shows once per evaluation.
  var tamerySqlLanguage: IDisposable[] | undefined
}

for (const disposable of globalThis.tamerySqlLanguage ?? []) {
  disposable.dispose()
}
globalThis.tamerySqlLanguage =
  Object.values(ConnectionType).flatMap(registerSqlLanguage)
