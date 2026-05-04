import { memoize } from '@conar/memoize'
import { createComputed } from 'seitu'
import { getEditorQueries } from '~/entities/connection/utils'
import { getConnectionResourceStore } from '.'

export const getEditorQueriesComputed = memoize((id: string) => {
  const store = getConnectionResourceStore(id)
  const computed = createComputed(store, state => getEditorQueries(state.query))

  computed.subscribe((editorQueries) => {
    const state = store.get()
    const currentLineNumbers = editorQueries.map(query => query.startLineNumber)
    const newSelectedLines = state.selectedLines.filter(line => currentLineNumbers.includes(line))

    if (
      newSelectedLines.length !== state.selectedLines.length
      || newSelectedLines.some((line, i) => line !== state.selectedLines[i])
    ) {
      store.set(state => ({
        ...state,
        selectedLines: newSelectedLines.toSorted((a, b) => a - b),
      } satisfies typeof state))
    }
  })

  return computed
})
