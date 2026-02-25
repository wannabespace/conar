import type { editor, Position } from 'monaco-editor'
import type { Dispatch, RefObject, SetStateAction } from 'react'
import { render } from '@conar/ui/lib/render'
import { useStore } from '@tanstack/react-store'
import { KeyCode, KeyMod } from 'monaco-editor'
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { connectionResourceStore } from '~/entities/connection/store'
import { useSubscription } from '~/entities/user/hooks'
import { Route } from '../..'
import { runnerHooks } from '../../-page'
import { RunnerEditorAIZone } from './runner-editor-ai-zone'

function useTrackLineNumberChange(monacoRef: RefObject<editor.IStandaloneCodeEditor | null>, {
  currentAIZoneLineNumber,
  setCurrentAIZoneLineNumber,
}: {
  currentAIZoneLineNumber: number | null
  setCurrentAIZoneLineNumber: Dispatch<SetStateAction<number | null>>
}) {
  useEffect(() => {
    if (!monacoRef.current || currentAIZoneLineNumber === null)
      return

    const editor = monacoRef.current

    const disposable = editor.onDidChangeModelContent((e) => {
      for (const change of e.changes) {
        const changeStartLine = change.range.startLineNumber
        const changeEndLine = change.range.endLineNumber
        const newLineCount = change.text.split('\n').length - 1
        const removedLineCount = changeEndLine - changeStartLine

        if (changeStartLine < currentAIZoneLineNumber) {
          const lineDiff = newLineCount - removedLineCount

          if (lineDiff !== 0) {
            setCurrentAIZoneLineNumber(prev => prev === null ? null : prev + lineDiff)
          }
        }
      }
    })

    return () => disposable.dispose()
  }, [monacoRef, currentAIZoneLineNumber, setCurrentAIZoneLineNumber])
}

export function useRunnerEditorAIZones(monacoRef: RefObject<editor.IStandaloneCodeEditor | null>) {
  const { connection, connectionResource } = Route.useRouteContext()
  const store = connectionResourceStore(connectionResource.id)
  const editorQueries = useStore(store, state => state.editorQueries)
  const domElementRef = useRef<HTMLElement>(null)
  const { subscription } = useSubscription()

  const [currentAIZoneLineNumber, setCurrentAIZoneLineNumber] = useState<number | null>(null)

  const currentAIZoneQuery = useMemo(() => {
    if (currentAIZoneLineNumber === null)
      return null

    return editorQueries.find(query =>
      currentAIZoneLineNumber >= query.startLineNumber
      && currentAIZoneLineNumber <= query.endLineNumber,
    ) ?? null
  }, [currentAIZoneLineNumber, editorQueries])

  if (currentAIZoneLineNumber && !currentAIZoneQuery) {
    setCurrentAIZoneLineNumber(null)
  }

  useEffect(() => {
    if (currentAIZoneLineNumber === null) {
      domElementRef.current = null
      monacoRef.current?.focus()
    }
  }, [currentAIZoneLineNumber, monacoRef])

  useTrackLineNumberChange(monacoRef, {
    currentAIZoneLineNumber,
    setCurrentAIZoneLineNumber,
  })

  useEffect(() => {
    if (!monacoRef.current || !currentAIZoneQuery)
      return

    const editor = monacoRef.current

    const highlightCollection = editor.createDecorationsCollection([{
      range: {
        startLineNumber: currentAIZoneQuery.startLineNumber,
        startColumn: 1,
        endLineNumber: currentAIZoneQuery.endLineNumber + 1,
        endColumn: 1,
      },
      options: {
        className: 'monaco-highlight',
      },
    }])

    let zoneId: string

    queueMicrotask(() => {
      editor.changeViewZones((changeAccessor) => {
        const domNode = domElementRef.current || render(
          <RunnerEditorAIZone
            connection={connection}
            connectionResource={connectionResource}
            getSql={() => store
              .state
              .query
              .split('\n')
              .slice(currentAIZoneQuery.startLineNumber - 1, currentAIZoneQuery.endLineNumber)
              .join('\n')}
            onClose={() => {
              editor.changeViewZones((changeAccessor) => {
                changeAccessor.removeZone(zoneId)
              })
              highlightCollection.clear()
              setCurrentAIZoneLineNumber(null)
            }}
            onUpdate={(query) => {
              runnerHooks.callHook('replaceQuery', {
                query,
                startLineNumber: currentAIZoneQuery.startLineNumber,
                endLineNumber: currentAIZoneQuery.endLineNumber,
              })
            }}
          />,
        )

        domNode.style.zIndex = '100'

        zoneId = changeAccessor.addZone({
          afterLineNumber: currentAIZoneQuery.startLineNumber - 1,
          heightInPx: subscription ? 100 : 120,
          domNode,
        })

        domElementRef.current = domNode
      })
    })

    return () => {
      editor.changeViewZones((changeAccessor) => {
        changeAccessor.removeZone(zoneId)
      })
      highlightCollection.clear()
    }
  }, [monacoRef, connection, connectionResource, currentAIZoneQuery, store, subscription])

  const getInlineQueryEvent = useEffectEvent((position: Position) => {
    return editorQueries.find(query =>
      position.lineNumber >= query.startLineNumber
      && position.lineNumber <= query.endLineNumber,
    ) ?? null
  })

  useEffect(() => {
    if (!monacoRef.current)
      return

    const kAction = monacoRef.current.addAction({
      id: 'conar.execute-on-k',
      label: 'Execute on K',
      keybindings: [KeyMod.CtrlCmd | KeyCode.KeyK],
      run: (e) => {
        const position = e.getPosition()

        if (!position)
          return

        const inlineQuery = getInlineQueryEvent(position)

        if (inlineQuery === null)
          return

        setCurrentAIZoneLineNumber(lineNumber =>
          lineNumber === position.lineNumber ? null : position.lineNumber,
        )
      },
    })

    return () => kAction.dispose()
  }, [monacoRef])
}
