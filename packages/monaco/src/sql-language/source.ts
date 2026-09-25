import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { silently } from '@tamery/shared/utils'
import type { SqlCatalog } from '@tamery/sql'
import {
  catalogSummary,
  dialects,
  splitStatements,
  statementScope,
} from '@tamery/sql'
import type { editor } from 'monaco-editor'
import { Range } from 'monaco-editor'

export interface TableRef {
  name: string
  schema: string | null
}

export interface SqlSource {
  /** The catalog as far as the cache knows it — columns stay `null` until a table's columns were fetched. */
  catalog: () => SqlCatalog
  complete: (
    input: { context: string; prefix: string; suffix: string },
    signal: AbortSignal
  ) => Promise<string>
  ghostTextEnabled: () => boolean
  loadColumns: (refs: TableRef[]) => Promise<unknown>
  onCatalogChange: (listener: () => void) => () => void
  type: ConnectionType
}

export const boundSources = new WeakMap<editor.ITextModel, SqlSource>()

export const EMPTY_CATALOG: SqlCatalog = {
  defaultSchema: null,
  enums: [],
  schemas: [],
}

export const rangeOf = (model: editor.ITextModel, start: number, end: number) =>
  Range.fromPositions(model.getPositionAt(start), model.getPositionAt(end))

export const tablesIn = (text: string, connectionType: ConnectionType) =>
  splitStatements(text, dialects[connectionType]).flatMap(
    (statement) => statementScope(statement.tokens).tables
  )

export const catalogSummaryFor = async (source: SqlSource, sql: string) => {
  await silently(() => source.loadColumns(tablesIn(sql, source.type)))
  return catalogSummary(source.catalog())
}
