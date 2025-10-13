import type { editor, Position } from 'monaco-editor'
import type { RefObject } from 'react'
import type { databases } from '~/drizzle'
import { Button } from '@conar/ui/components/button'
import { Enter } from '@conar/ui/components/custom/shortcuts'
import { Textarea } from '@conar/ui/components/textarea'
import { render } from '@conar/ui/lib/render'
import { cn } from '@conar/ui/lib/utils'
import { useKeyboardEvent } from '@react-hookz/web'
import { useMutation } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { KeyCode, KeyMod } from 'monaco-editor'
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { orpcQuery } from '~/lib/orpc'
import { queryClient } from '~/main'
import { Route } from '../..'
import { pageStore, queries } from '../../-lib'

function RunnerEditorAIZone({
  database,
  getSql,
  onUpdate,
  onClose,
}: {
  database: typeof databases.$inferSelect
  getSql: () => string
  onUpdate: (sql: string) => void
  onClose: () => void
}) {
  const [text, setText] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  useKeyboardEvent(e => e.key === 'Escape', () => {
    onClose()
  })

  useEffect(() => {
    const timeout = setTimeout(() => {
      ref.current?.focus()
    }, 0)

    return () => {
      clearTimeout(timeout)
    }
  }, [ref])

  const { mutate: updateSQL, isPending } = useMutation(orpcQuery.ai.updateSQL.mutationOptions({
    onSuccess: (data) => {
      onUpdate(data)
      onClose()
    },
  }), queryClient)

  return (
    <div className="h-full flex flex-col py-1 pr-6">
      <div className="h-full relative max-w-lg">
        <Textarea
          ref={ref}
          value={text}
          disabled={isPending}
          onChange={e => setText(e.target.value)}
          className={cn(
            'h-full min-h-full field-sizing-content resize-none py-1.5 px-2',
            // Disable monaco default styles
            'focus-visible:outline-none! focus-visible:border-border! focus:border-border! focus-visible:ring-0!',
          )}
          placeholder="Update selected SQL with AI"
          onKeyDown={(e) => {
            e.stopPropagation()

            if (e.key === 'Enter') {
              e.preventDefault()
              updateSQL({
                prompt: text,
                sql: getSql(),
                type: database.type,
              })
            }
          }}
        />
        <Button
          size="xs"
          className="absolute bottom-2 right-2"
          disabled={isPending}
        >
          Send
          <Enter />
        </Button>
      </div>
    </div>
  )
}

export function useRunnerEditorAIZone(monacoRef: RefObject<editor.IStandaloneCodeEditor | null>) {
  const { database } = Route.useRouteContext()
  const queriesArray = useStore(queries)
  const domElementRef = useRef<HTMLElement>(null)

  const [currentAIZoneQueryId, setCurrentAIZoneQueryId] = useState<string | null>(null)

  const currentAIZoneQuery = useMemo(
    () => queriesArray.find(query => query.id === currentAIZoneQueryId) ?? null,
    [currentAIZoneQueryId, queriesArray],
  )

  if (currentAIZoneQueryId && !currentAIZoneQuery) {
    setCurrentAIZoneQueryId(null)
  }

  if (!currentAIZoneQueryId) {
    domElementRef.current = null
    monacoRef.current?.focus()
  }

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
            database={database}
            getSql={() => pageStore.state.sql
              .split('\n')
              .slice(currentAIZoneQuery.startLineNumber - 1, currentAIZoneQuery.endLineNumber)
              .join('\n')}
            onClose={() => {
              editor.changeViewZones((changeAccessor) => {
                changeAccessor.removeZone(zoneId)
              })
              highlightCollection.clear()
              setCurrentAIZoneQueryId(null)
            }}
            onUpdate={(newSql) => {
              pageStore.setState((state) => {
                const lines = state.sql.split('\n')
                const startIdx = currentAIZoneQuery.startLineNumber - 1
                const endIdx = currentAIZoneQuery.endLineNumber
                const newSqlLines = newSql.split('\n')
                const updatedLines = [
                  ...lines.slice(0, startIdx),
                  ...newSqlLines,
                  ...lines.slice(endIdx),
                ]
                return {
                  ...state,
                  sql: updatedLines.join('\n'),
                }
              })
            }}
          />,
        )

        domNode.style.zIndex = '100'

        zoneId = changeAccessor.addZone({
          afterLineNumber: currentAIZoneQuery.startLineNumber - 1,
          heightInPx: 90,
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
  }, [monacoRef, database, currentAIZoneQuery])

  const getInlineQueryEvent = useEffectEvent((position: Position) => {
    return queriesArray.find(query =>
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

        setCurrentAIZoneQueryId(id => id === inlineQuery.id ? null : inlineQuery.id)
      },
    })

    return kAction.dispose
  }, [monacoRef])
}
