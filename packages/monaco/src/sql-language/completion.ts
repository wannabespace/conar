import { silently } from '@tamery/shared/utils'
import type { CompletionKind, DialectSpec } from '@tamery/sql'
import { completionContext, completionItems, findTable } from '@tamery/sql'
import { languages } from 'monaco-editor'

import type { TableRef } from './source'
import { boundSources, EMPTY_CATALOG, rangeOf } from './source'

const COMPLETION_KINDS: Record<CompletionKind, languages.CompletionItemKind> = {
  column: languages.CompletionItemKind.Field,
  enum: languages.CompletionItemKind.EnumMember,
  function: languages.CompletionItemKind.Function,
  keyword: languages.CompletionItemKind.Keyword,
  operator: languages.CompletionItemKind.Operator,
  schema: languages.CompletionItemKind.Module,
  table: languages.CompletionItemKind.Class,
  value: languages.CompletionItemKind.Value,
  view: languages.CompletionItemKind.Interface,
}

const ASK_GHOST_TEXT = {
  id: 'editor.action.inlineSuggest.trigger',
  title: 'Suggest',
}

export const registerCompletion = (id: string, dialect: DialectSpec) =>
  languages.registerCompletionItemProvider(id, {
    provideCompletionItems: (model, position, trigger) => {
      const text = model.getValue()
      const offset = model.getOffsetAt(position)
      const context = completionContext(text, offset, dialect)
      // A space or paren opens the list only where something specific is expected
      // (`FROM `, `WHERE `, `IN (`), not after every word.
      const openedByGap =
        trigger.triggerCharacter === ' ' || trigger.triggerCharacter === '('
      if (openedByGap && context.expects === 'any') {
        return { suggestions: [] }
      }
      const source = boundSources.get(model)
      let catalog = EMPTY_CATALOG
      let missingColumns = false
      if (source) {
        catalog = source.catalog()
        // Never wait on the network: answer from the cache, start loading what a column
        // position needs, and mark the list incomplete so the next keystroke asks again.
        const [first, second] = context.qualifier
        const refs: TableRef[] = [...context.scope.tables]
        if (first !== undefined) {
          refs.push(
            second === undefined
              ? { name: first, schema: null }
              : { name: second, schema: first }
          )
        }
        missingColumns =
          (context.expects === 'column' || first !== undefined) &&
          refs.some(
            (ref) => findTable(catalog, ref.name, ref.schema)?.columns === null
          )
        if (missingColumns) {
          void silently(() => source.loadColumns(refs))
        }
      }
      const items = completionItems(context, catalog, dialect)
      // In a value slot (`col = `, `IN (`) the gap opens the list only for the values the column
      // takes; a bare list of columns there reads as the value to type.
      if (
        openedByGap &&
        context.expects === 'column' &&
        context.subject &&
        !items.some((item) => item.kind === 'enum' || item.kind === 'value')
      ) {
        return { incomplete: missingColumns, suggestions: [] }
      }
      const range = rangeOf(model, context.replaceStart, context.replaceEnd)
      return {
        incomplete: missingColumns,
        suggestions: items.map((item) => ({
          command: ASK_GHOST_TEXT,
          detail: item.detail,
          insertText: item.insertText,
          insertTextRules: item.snippet
            ? languages.CompletionItemInsertTextRule.InsertAsSnippet
            : undefined,
          kind: COMPLETION_KINDS[item.kind],
          label: item.label,
          range,
          sortText: item.sortText,
        })),
      }
    },
    triggerCharacters: ['.', ' ', '('],
  })
