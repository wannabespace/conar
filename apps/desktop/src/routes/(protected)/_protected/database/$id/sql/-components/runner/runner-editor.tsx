import type { DatabaseType } from '@conar/shared/enums/database-type'
import type { editor, Position } from 'monaco-editor'
import type { CompletionRegistration } from 'monacopilot'
import type { RefObject } from 'react'
import { useStore } from '@tanstack/react-store'
import * as monaco from 'monaco-editor'
import { KeyCode, KeyMod } from 'monaco-editor'
import { LanguageIdEnum, setupLanguageFeatures } from 'monaco-sql-languages'
import { registerCompletion } from 'monacopilot'
import { useEffect, useEffectEvent, useRef } from 'react'
import { Monaco } from '~/components/monaco'
import { databaseStore } from '~/entities/database'
import { databaseAICompletionContext, databaseCompletionService } from '~/entities/database/utils/monaco'
import { orpc } from '~/lib/orpc'
import { Route } from '../..'
import { runnerHooks } from '../../-page'
import { useRunnerContext } from './runner-context'
import { useRunnerEditorAIZones } from './runner-editor-ai-zones'
import { useRunnerEditorQueryZones } from './runner-editor-query-zones'

const dialectsMap = {
  postgres: LanguageIdEnum.PG,
  mysql: LanguageIdEnum.MYSQL,
  clickhouse: LanguageIdEnum.MYSQL,
} satisfies Record<DatabaseType, LanguageIdEnum>

function useRunnerEditorHooks(monacoRef: RefObject<editor.IStandaloneCodeEditor | null>) {
  const { database } = Route.useRouteContext()
  const store = databaseStore(database.id)

  const replace = ({
    query,
    startLineNumber,
    endLineNumber,
  }: {
    query: string
    startLineNumber: number
    endLineNumber: number
  }) => {
    const lines = store.state.sql.split('\n')
    const newSqlLines = query.split('\n')
    const updatedLines = [
      ...lines.slice(0, startLineNumber - 1),
      ...newSqlLines,
      ...lines.slice(endLineNumber),
    ]

    store.setState(state => ({
      ...state,
      sql: updatedLines.join('\n'),
    } satisfies typeof state))
  }

  const replaceEvent = useEffectEvent(replace)

  useEffect(() => {
    const appendToBottomHook = runnerHooks.hook('appendToBottom', (query) => {
      const editor = monacoRef.current
      if (!editor)
        return

      store.setState(state => ({
        ...state,
        sql: `${state.sql}\n\n${query}`,
      } satisfies typeof state))
    })
    const appendToBottomAndFocusHook = runnerHooks.hook('appendToBottomAndFocus', (query) => {
      runnerHooks.callHook('appendToBottom', query)
      window.requestAnimationFrame(() => {
        runnerHooks.callHook('scrollToBottom')
        runnerHooks.callHook('focus')
      })
    })
    const focusRunnerHook = runnerHooks.hook('focus', (lineNumber) => {
      const editor = monacoRef.current
      if (!editor)
        return

      if (lineNumber) {
        editor.setPosition({
          column: 1,
          lineNumber,
        })
      }

      editor.focus()
    })
    const scrollToLineHook = runnerHooks.hook('scrollToLine', (lineNumber) => {
      const editor = monacoRef.current
      if (!editor)
        return

      editor.revealLineInCenter(lineNumber)
    })
    const scrollToBottomHook = runnerHooks.hook('scrollToBottom', () => {
      const editor = monacoRef.current
      if (!editor)
        return

      const lineCount = editor.getModel()?.getLineCount()

      if (lineCount) {
        editor.revealLineInCenter(lineCount)
      }
    })
    const replaceQueryHook = runnerHooks.hook('replaceQuery', ({ query, startLineNumber, endLineNumber }) => {
      replaceEvent({ query, startLineNumber, endLineNumber })
    })

    return () => {
      appendToBottomHook()
      appendToBottomAndFocusHook()
      focusRunnerHook()
      scrollToLineHook()
      scrollToBottomHook()
      replaceQueryHook()
    }
  }, [store, monacoRef])
}

export function RunnerEditor() {
  const { database } = Route.useRouteContext()
  const store = databaseStore(database.id)
  const sql = useStore(store, state => state.sql)
  const editorQueries = useStore(store, state => state.editorQueries)
  const monacoRef = useRef<editor.IStandaloneCodeEditor>(null)
  const completionRef = useRef<CompletionRegistration | null>(null)
  const completionCacheRef = useRef<{
    prefix: string
    completion: string
  } | null>(null)

  const run = useRunnerContext(({ run }) => run)

  const runEvent = useEffectEvent(run)

  useRunnerEditorHooks(monacoRef)

  useRunnerEditorQueryZones(monacoRef)
  useRunnerEditorAIZones(monacoRef)

  useEffect(() => {
    setupLanguageFeatures(dialectsMap[database.type], {
      completionItems: {
        enable: true,
        completionService: databaseCompletionService(database),
      },
    })
  }, [database])

  useEffect(() => {
    if (!monacoRef.current)
      return

    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    let pendingResolve: ((value: { completion: string }) => void) | null = null

    let isMounted = true

    const setupCompletion = async () => {
      if (!isMounted)
        return

      const aiConfig = await databaseAICompletionContext(database)
      if (!isMounted)
        return

      const schemaContext = await aiConfig.buildSchemaContext()

      if (!isMounted)
        return

      if (completionRef.current) {
        completionRef.current.deregister()
      }

      if (!monacoRef.current)
        return

      completionRef.current = registerCompletion(
        monaco,
        monacoRef.current,
        {
          trigger: 'onTyping',
          language: dialectsMap[database.type],
          requestHandler: async () => {
            const model = monacoRef.current?.getModel()
            const position = monacoRef.current?.getPosition()

            if (model && position && completionCacheRef.current) {
              const offset = model.getOffsetAt(position)
              const textFull = model.getValue()
              const textBefore = textFull.substring(0, offset)
              const cached = completionCacheRef.current

              if (textBefore.startsWith(cached.prefix)) {
                const addedText = textBefore.slice(cached.prefix.length)

                if (cached.completion.startsWith(addedText)) {
                  const remainingCompletion = cached.completion.slice(addedText.length)

                  if (remainingCompletion.length > 0) {
                    return { completion: remainingCompletion }
                  }

                  return { completion: '' }
                }
              }
            }

            if (debounceTimer) {
              clearTimeout(debounceTimer)
            }
            if (pendingResolve) {
              pendingResolve({ completion: '' })
              pendingResolve = null
            }

            return new Promise((resolve) => {
              pendingResolve = resolve
              debounceTimer = setTimeout(async () => {
                if (!isMounted)
                  return

                try {
                  const model = monacoRef.current?.getModel()
                  const position = monacoRef.current?.getPosition()

                  if (!model || !position) {
                    resolve({ completion: '' })
                    return
                  }

                  const fileContent = model.getValue()
                  const offset = model.getOffsetAt(position)
                  const context = fileContent.substring(0, offset)
                  const suffix = fileContent.substring(offset)

                  if (context.trim().length < 2) {
                    resolve({ completion: '' })
                    return
                  }

                  const transformedBody = {
                    context,
                    suffix,
                    instruction: 'Complete the SQL query with secure and safe optimised version',
                    fileContent,
                    databaseType: aiConfig.databaseType,
                    schemaContext,
                  }

                  const result = await orpc.ai.codeCompletion(transformedBody)

                  if (pendingResolve === resolve) {
                    completionCacheRef.current = {
                      prefix: context,
                      completion: result.completion,
                    }

                    resolve(result)
                  }
                  else {
                    resolve({ completion: '' })
                  }
                }
                catch (error) {
                  console.error(error)
                  resolve({ completion: '' })
                }
                finally {
                  if (pendingResolve === resolve)
                    pendingResolve = null
                }
              }, 500)
            })
          },
        },
      )
    }

    setupCompletion()

    return () => {
      isMounted = false
      if (debounceTimer)
        clearTimeout(debounceTimer)
      if (pendingResolve)
        pendingResolve({ completion: '' })
      if (completionRef.current) {
        completionRef.current.deregister()
        completionRef.current = null
      }
    }
  }, [database])

  const getEditorQueriesEvent = useEffectEvent((position: Position) => {
    return editorQueries.find(query =>
      position.lineNumber >= query.startLineNumber
      && position.lineNumber <= query.endLineNumber,
    ) ?? null
  })

  useEffect(() => {
    if (!monacoRef.current)
      return

    const enterAction = monacoRef.current?.addAction({
      id: 'conar.execute-on-enter',
      label: 'Execute on Enter',
      keybindings: [KeyMod.CtrlCmd | KeyCode.Enter],
      run: (e) => {
        const position = e.getPosition()

        if (!position)
          return

        const editorQuery = getEditorQueriesEvent(position)

        if (!editorQuery)
          return

        const query = editorQuery.queries.at(-1)

        if (!query)
          return

        runEvent([{
          startLineNumber: editorQuery.startLineNumber,
          endLineNumber: editorQuery.endLineNumber,
          query,
        }])
      },
    })

    return () => enterAction.dispose()
  }, [])

  return (
    <Monaco
      data-mask
      ref={monacoRef}
      language={dialectsMap[database.type]}
      value={sql}
      onChange={q => store.setState(state => ({
        ...state,
        sql: q,
      } satisfies typeof state))}
      className="size-full"
      options={{
        wordWrap: 'on',
      }}
    />
  )
}
