import type { editor } from 'monaco-editor'
import type { RefObject } from 'react'
import type { Root } from 'react-dom/client'
import { renderWithRoot } from '@conar/ui/lib/render'
import { useEffect, useEffectEvent } from 'react'
import { getConnectionResourceStore, getEditorQueriesComputed } from '~/entities/connection/store'
import { Route } from '../..'
import { useRunnerContext } from './runner-context'
import { RunnerEditorQueryZone } from './runner-editor-query-zone'

export function useRunnerEditorQueryZones(monacoRef: RefObject<editor.IStandaloneCodeEditor | null>) {
  const { connection, connectionResource } = Route.useRouteContext()
  const store = getConnectionResourceStore(connectionResource.id)
  const editorQueriesStore = getEditorQueriesComputed(connectionResource.id)

  const getQueriesEvent = useEffectEvent((lineNumber: number) =>
    editorQueriesStore.get().find(query => query.startLineNumber === lineNumber),
  )

  const run = useRunnerContext(({ run }) => run)
  const runEvent = useEffectEvent(run)
  const save = useRunnerContext(({ save }) => save)
  const saveEvent = useEffectEvent(save)

  const createZoneHandlers = useEffectEvent((lineNumber: number) => ({
    onRun: (index: number) => {
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
    },
    getQuery: () => {
      const query = getQueriesEvent(lineNumber)

      if (!query)
        throw new Error('Query not found')

      const { startLineNumber, endLineNumber } = query

      return store.get().query.split('\n').slice(startLineNumber - 1, endLineNumber).join('\n')
    },
    onSave: () => {
      const query = getQueriesEvent(lineNumber)

      if (!query)
        return

      const { startLineNumber, endLineNumber } = query

      saveEvent(store.get().query.split('\n').slice(startLineNumber - 1, endLineNumber).join('\n'))
    },
  }))

  useEffect(() => {
    const editor = monacoRef.current
    if (!editor)
      return

    const zones = new Map<number, {
      zoneId: string
      domNode: HTMLDivElement
      root: Root
    }>()

    const syncZones = () => {
      const nextLines = editorQueriesStore.get().map(q => q.startLineNumber)
      const nextSet = new Set(nextLines)

      let needsChange = zones.size !== nextSet.size
      if (!needsChange) {
        for (const line of nextLines) {
          if (!zones.has(line)) {
            needsChange = true
            break
          }
        }
      }

      if (!needsChange)
        return

      editor.changeViewZones((changeAccessor) => {
        for (const [lineNumber, zone] of zones) {
          if (nextSet.has(lineNumber))
            continue

          changeAccessor.removeZone(zone.zoneId)
          zone.domNode.remove()
          queueMicrotask(() => zone.root.unmount())
          zones.delete(lineNumber)
        }

        for (const lineNumber of nextLines) {
          if (zones.has(lineNumber))
            continue

          const handlers = createZoneHandlers(lineNumber)
          const { domNode, root } = renderWithRoot(
            <RunnerEditorQueryZone
              connectionResource={connectionResource}
              connectionType={connection.type}
              lineNumber={lineNumber}
              onRun={handlers.onRun}
              getQuery={handlers.getQuery}
              onSave={handlers.onSave}
            />,
          )

          domNode.style.zIndex = '100'

          const zoneId = changeAccessor.addZone({
            afterLineNumber: lineNumber - 1,
            heightInPx: 32,
            domNode,
          })

          zones.set(lineNumber, { zoneId, domNode, root })
        }
      })
    }

    queueMicrotask(syncZones)

    const unsubscribe = editorQueriesStore.subscribe(syncZones)

    return () => {
      unsubscribe()
      editor.changeViewZones((changeAccessor) => {
        for (const zone of zones.values()) {
          changeAccessor.removeZone(zone.zoneId)
          zone.domNode.remove()
          queueMicrotask(() => zone.root.unmount())
        }
        zones.clear()
      })
    }
  }, [monacoRef, editorQueriesStore, connectionResource, connection.type])
}
