import type { editor } from 'monaco-editor'
import type { RefObject } from 'react'
import { render } from '@conar/ui/lib/render'
import { useEffect, useEffectEvent, useRef } from 'react'
import { useSubscription } from 'seitu/react'
import { getConnectionResourceStore, getEditorQueriesComputed } from '~/entities/connection/store'
import { Route } from '../..'
import { useRunnerContext } from './runner-context'
import { RunnerEditorQueryZone } from './runner-editor-query-zone'

export function useRunnerEditorQueryZones(monacoRef: RefObject<editor.IStandaloneCodeEditor | null>) {
  const { connection, connectionResource } = Route.useRouteContext()
  const store = getConnectionResourceStore(connectionResource.id)
  const editorQueriesStore = getEditorQueriesComputed(connectionResource.id)
  const linesWithQueries = useSubscription(editorQueriesStore, { selector: state => state.map(({ startLineNumber }) => startLineNumber) })

  const getQueriesEvent = useEffectEvent((lineNumber: number) =>
    editorQueriesStore.get().find(query => query.startLineNumber === lineNumber),
  )

  const run = useRunnerContext(({ run }) => run)
  const runEvent = useEffectEvent(run)
  const save = useRunnerContext(({ save }) => save)
  const saveEvent = useEffectEvent(save)

  const elementsRef = useRef<Record<number, HTMLDivElement>>({})

  useEffect(() => {
    if (!monacoRef.current)
      return

    const editor = monacoRef.current
    const elements = elementsRef.current
    const viewZoneIds: { id: string, lineNumber: number }[] = []

    queueMicrotask(() => {
      editor.changeViewZones((changeAccessor) => {
        linesWithQueries.forEach((lineNumber) => {
          elements[lineNumber] ||= render(
            <RunnerEditorQueryZone
              connectionResource={connectionResource}
              connectionType={connection.type}
              lineNumber={lineNumber}
              onRun={(index) => {
                const editorQuery = getQueriesEvent(lineNumber)

                if (!editorQuery)
                  return

                const query = editorQuery.queries.at(index)

                if (!query)
                  return

                runEvent([{
                  startLineNumber: editorQuery.startLineNumber,
                  endLineNumber: editorQuery.endLineNumber,
                  query,
                }])
              }}
              getQuery={() => {
                const query = getQueriesEvent(lineNumber)

                if (!query)
                  throw new Error('Query not found')

                const { startLineNumber, endLineNumber } = query

                return store.get().query.split('\n').slice(startLineNumber - 1, endLineNumber).join('\n')
              }}
              onSave={() => {
                const query = getQueriesEvent(lineNumber)

                if (!query)
                  return

                const { startLineNumber, endLineNumber } = query

                saveEvent(store.get().query.split('\n').slice(startLineNumber - 1, endLineNumber).join('\n'))
              }}
            />,
          )

          const domNode = elements[lineNumber]!

          domNode.style.zIndex = '100'

          const zoneId = changeAccessor.addZone({
            afterLineNumber: lineNumber - 1,
            heightInPx: 32,
            domNode,
          })

          viewZoneIds.push({ id: zoneId, lineNumber })
        })
      })
    })

    return () => {
      editor.changeViewZones((changeAccessor) => {
        viewZoneIds.forEach(({ id, lineNumber }) => {
          changeAccessor.removeZone(id)

          if (!linesWithQueries.includes(lineNumber)) {
            elements[lineNumber]?.remove()
            delete elements[lineNumber]
          }
        })
      })
    }
  }, [monacoRef, linesWithQueries, connectionResource, store, connection.type])
}
