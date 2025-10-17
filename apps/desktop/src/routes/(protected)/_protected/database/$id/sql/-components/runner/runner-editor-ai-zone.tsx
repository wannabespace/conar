import type { editor, Position } from 'monaco-editor'
import type { CSSProperties, RefObject } from 'react'
import type { databases } from '~/drizzle'
import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Enter } from '@conar/ui/components/custom/shortcuts'
import { Popover, PopoverAnchor, PopoverContent } from '@conar/ui/components/popover'
import { Textarea } from '@conar/ui/components/textarea'
import { render } from '@conar/ui/lib/render'
import { cn } from '@conar/ui/lib/utils'
import { useKeyboardEvent } from '@react-hookz/web'
import { useMutation } from '@tanstack/react-query'
import { KeyCode, KeyMod } from 'monaco-editor'
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { MonacoDiff } from '~/components/monaco-diff'
import { orpcQuery } from '~/lib/orpc'
import { queryClient } from '~/main'
import { Route } from '../..'
import { databaseStore, useSQLQueries } from '../../../../-store'

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
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const ref = useRef<HTMLTextAreaElement>(null)
  const originalSql = useRef('')

  function fullClose() {
    onClose()
    setAiSuggestion(null)
    setText('')
  }

  useKeyboardEvent(e => e.key === 'Escape', () => {
    fullClose()
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
      setAiSuggestion(data)
    },
  }), queryClient)

  function handleSubmit() {
    if (!text.trim()) {
      return
    }

    originalSql.current = getSql()

    if (aiSuggestion) {
      onUpdate(aiSuggestion)
      fullClose()
    }
    else {
      updateSQL({
        sql: originalSql.current,
        prompt: text,
        type: database.type,
      })
    }
  }

  return (
    <div className="h-full flex flex-col py-1 pr-6">
      <Popover open={!!aiSuggestion}>
        <PopoverAnchor asChild>
          <div className="h-full relative w-lg">
            <Textarea
              ref={ref}
              value={text}
              disabled={isPending}
              onChange={(e) => {
                setText(e.target.value)
                setAiSuggestion(null)
              }}
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
                  handleSubmit()
                }
              }}
            />
            <Button
              size="xs"
              className="absolute bottom-2 right-2"
              disabled={isPending || !text.trim()}
              onClick={handleSubmit}
            >
              <LoadingContent loading={isPending} loaderClassName="size-4">
                {aiSuggestion ? 'Apply' : 'Send'}
                <Enter />
              </LoadingContent>
            </Button>
          </div>
        </PopoverAnchor>
        {!!aiSuggestion && (
          <PopoverContent
            style={{
              '--lines-height': `${aiSuggestion.split('\n').length * 18 * 2}px`,
            } as CSSProperties}
            className="p-0 w-lg h-[min(30vh,var(--lines-height))]"
            onOpenAutoFocus={(e) => {
              e.preventDefault()
              ref.current?.focus()
            }}
          >
            <MonacoDiff
              originalValue={originalSql.current}
              modifiedValue={aiSuggestion}
              language="sql"
              className="h-full"
              options={{
                scrollBeyondLastLine: false,
                renderIndicators: false,
                lineNumbers: 'off',
              }}
            />
          </PopoverContent>
        )}
      </Popover>
    </div>
  )
}

export function useRunnerEditorAIZone(monacoRef: RefObject<editor.IStandaloneCodeEditor | null>) {
  const { database } = Route.useRouteContext()
  const store = databaseStore(database.id)
  const queries = useSQLQueries(database.id)
  const domElementRef = useRef<HTMLElement>(null)

  const [currentAIZoneLineNumber, setCurrentAIZoneLineNumber] = useState<number | null>(null)

  const currentAIZoneQuery = useMemo(() => {
    if (currentAIZoneLineNumber === null)
      return null

    return queries.find(query =>
      currentAIZoneLineNumber >= query.startLineNumber
      && currentAIZoneLineNumber <= query.endLineNumber,
    ) ?? null
  }, [currentAIZoneLineNumber, queries])

  if (currentAIZoneLineNumber && !currentAIZoneQuery) {
    setCurrentAIZoneLineNumber(null)
  }

  if (currentAIZoneLineNumber === null) {
    domElementRef.current = null
    monacoRef.current?.focus()
  }

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

        // If change was on the line before the current AI zone line number
        if (changeStartLine < currentAIZoneLineNumber) {
          const lineDiff = newLineCount - removedLineCount

          if (lineDiff !== 0) {
            setCurrentAIZoneLineNumber(prev => prev === null ? null : prev + lineDiff)
          }
        }
      }
    })

    return () => disposable.dispose()
  }, [monacoRef, currentAIZoneLineNumber])

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
            getSql={() => store
              .state
              .sql
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
            onUpdate={(newSql) => {
              const lines = store.state.sql.split('\n')
              const startIdx = currentAIZoneQuery.startLineNumber - 1
              const endIdx = currentAIZoneQuery.endLineNumber
              const newSqlLines = newSql.split('\n')
              const updatedLines = [
                ...lines.slice(0, startIdx),
                ...newSqlLines,
                ...lines.slice(endIdx),
              ]

              store.setState(state => ({
                ...state,
                sql: updatedLines.join('\n'),
              } satisfies typeof state))
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
  }, [monacoRef, database, currentAIZoneQuery, store])

  const getInlineQueryEvent = useEffectEvent((position: Position) => {
    return queries.find(query =>
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
