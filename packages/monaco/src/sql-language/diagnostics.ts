import { silently } from '@tamery/shared/utils'
import { diagnose, dialects } from '@tamery/sql'
import { editor, MarkerSeverity } from 'monaco-editor'

import type { SqlSource } from './source'
import { rangeOf, tablesIn } from './source'

const DIAGNOSTICS_DELAY = 250
const MARKER_OWNER = 'tamery-sql'

export const attachSqlDiagnostics = (
  codeEditor: editor.IStandaloneCodeEditor,
  source: SqlSource
) => {
  const dialect = dialects[source.type]
  let timer: ReturnType<typeof setTimeout> | undefined

  const run = () => {
    const model = codeEditor.getModel()
    if (!model) {
      return
    }
    const text = model.getValue()
    const catalog = source.catalog()
    silently(() => source.loadColumns(tablesIn(text, source.type)))
    const markers = diagnose(text, dialect, catalog).map((diagnostic) => ({
      ...rangeOf(model, diagnostic.start, diagnostic.end),
      message: diagnostic.message,
      severity:
        diagnostic.severity === 'error'
          ? MarkerSeverity.Error
          : MarkerSeverity.Warning,
    }))
    editor.setModelMarkers(model, MARKER_OWNER, markers)
  }

  const schedule = () => {
    clearTimeout(timer)
    timer = setTimeout(run, DIAGNOSTICS_DELAY)
  }

  schedule()
  const contentListener = codeEditor.onDidChangeModelContent(schedule)
  const unsubscribeCatalog = source.onCatalogChange(schedule)

  return () => {
    clearTimeout(timer)
    contentListener.dispose()
    unsubscribeCatalog()
    const model = codeEditor.getModel()
    if (model) {
      editor.setModelMarkers(model, MARKER_OWNER, [])
    }
  }
}
