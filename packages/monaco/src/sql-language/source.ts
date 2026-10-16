import type { SqlDialect } from '@tamery/shared/enums/connection-type'
import { silently } from '@tamery/shared/utils'
import type { SqlCatalog } from '@tamery/sql'
import { dialects, splitStatements, statementScope } from '@tamery/sql'
import type { editor } from 'monaco-editor'
import { Range } from 'monaco-editor'

import { catalogSummary } from './catalog-summary'

export interface TableRef {
  name: string
  schema: string | null
}

export interface SqlSource {
  catalog: () => SqlCatalog
  complete: (
    input: { context: string; prefix: string; suffix: string },
    signal: AbortSignal
  ) => Promise<string>
  ghostTextEnabled: () => boolean
  load: (refs: TableRef[]) => Promise<unknown> | undefined
  onCatalogChange: (listener: () => void) => () => void
  type: SqlDialect
}

export const boundSources = new WeakMap<editor.ITextModel, SqlSource>()

export const EMPTY_CATALOG: SqlCatalog = {
  defaultSchema: null,
  enums: [],
  schemas: [],
}

export const getRange = (
  model: editor.ITextModel,
  start: number,
  end: number
) => Range.fromPositions(model.getPositionAt(start), model.getPositionAt(end))

export const tablesIn = (text: string, dialect: SqlDialect) =>
  splitStatements(text, dialects[dialect]).flatMap(
    (statement) => statementScope(statement.tokens).tables
  )

export const catalogSummaryFor = async (
  model: editor.ITextModel,
  sql: string
) => {
  const source = boundSources.get(model)
  if (!source) {
    return ''
  }
  await silently(() => source.load(tablesIn(sql, source.type)))
  return catalogSummary(source.catalog())
}
