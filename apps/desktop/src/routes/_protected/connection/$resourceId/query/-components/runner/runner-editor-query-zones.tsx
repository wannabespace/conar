import type { editor } from 'monaco-editor'
import type { RefObject } from 'react'
import { copy } from '@conar/ui/lib/copy'
import { render } from '@conar/ui/lib/render'
import { useStore } from '@tanstack/react-store'
import { useEffect, useEffectEvent, useRef } from 'react'
import { connectionResourceStore } from '~/entities/connection/store'
import { Route } from '../..'
import { useRunnerContext } from './runner-context'
import { RunnerEditorQueryZone } from './runner-editor-query-zone'

export function useRunnerEditorQueryZones(monacoRef: RefObject<editor.IStandaloneCodeEditor | null>) {
  const { connectionResource } = Route.useRouteContext()
  const store = connectionResourceStore(connectionResource.id)
  const linesWithQueries = useStore(store, state => state.editorQueries.map(({ startLineNumber }) => startLineNumber))

  const getQueriesEvent = useEffectEvent((lineNumber: number) =>
    store.state.editorQueries.find(query => query.startLineNumber === lineNumber),
  )

  const run = useRunnerContext(({ run }) => run)
  const runEvent = useEffectEvent(run)
  const save = useRunnerContext(({ save }) => save)
  const saveEvent = useEffectEvent(save)

  const elementsRef = useRef<Record<number, HTMLDivElement>>([])

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
              onCopy={() => {
                const query = getQueriesEvent(lineNumber)

                if (!query)
                  return

                const { startLineNumber, endLineNumber } = query

                copy(store.state.query.split('\n').slice(startLineNumber - 1, endLineNumber).join('\n'))
              }}
              onSave={() => {
                const query = getQueriesEvent(lineNumber)

                if (!query)
                  return

                const { startLineNumber, endLineNumber } = query

                saveEvent(store.state.query.split('\n').slice(startLineNumber - 1, endLineNumber).join('\n'))
              }}
            />,
          )

          elements[lineNumber]!.style.zIndex = '100'

          const zoneId = changeAccessor.addZone({
            afterLineNumber: lineNumber - 1,
            heightInPx: 32,
            domNode: elements[lineNumber]!,
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
  }, [monacoRef, linesWithQueries, connectionResource, store])
}
