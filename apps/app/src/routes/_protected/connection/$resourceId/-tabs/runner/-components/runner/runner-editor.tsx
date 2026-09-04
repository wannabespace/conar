import { getRouteApi } from '@tanstack/react-router'
import type { editor, Position } from 'monaco-editor'
import { KeyCode, KeyMod } from 'monaco-editor'
import { setupLanguageFeatures } from 'monaco-sql-languages'
import type { RefObject } from 'react'
import { useEffect, useEffectEvent, useRef } from 'react'

import { Monaco } from '~/components/monaco'
import {
  connectionCompletionService,
  sqlDialects,
} from '~/entities/connection/utils/monaco'

import { useEditorQueriesComputed, useRunnerPageStore } from '../../-lib/store'
import { runnerHooks } from '../../-page'
import { useRunnerContext } from './runner-context'
import { useRunnerEditorAIZones } from './runner-editor-ai-zones'
import { useRunnerEditorQueryZones } from './runner-editor-query-zones'

const { useRouteContext } = getRouteApi(
  '/_protected/connection/$resourceId/$tabId'
)

const MONACO_OPTIONS = {
  wordWrap: 'on',
} satisfies editor.IStandaloneEditorConstructionOptions

const useRunnerEditorHooks = (
  monacoRef: RefObject<editor.IStandaloneCodeEditor | null>
) => {
  const store = useRunnerPageStore()

  const replace = ({
    query,
    startLineNumber,
    endLineNumber,
  }: {
    query: string
    startLineNumber: number
    endLineNumber: number
  }) => {
    const lines = store.get().query.split('\n')
    const newSqlLines = query.split('\n')
    const updatedLines = [
      ...lines.slice(0, startLineNumber - 1),
      ...newSqlLines,
      ...lines.slice(endLineNumber),
    ]

    store.set(
      (state) =>
        ({
          ...state,
          query: updatedLines.join('\n'),
        }) satisfies typeof state
    )
  }

  const replaceEvent = useEffectEvent(replace)

  useEffect(() => {
    const appendToBottomHook = runnerHooks.hook('appendToBottom', (query) => {
      store.set(
        (state) =>
          ({
            ...state,
            query: state.query ? `${state.query}\n\n${query}` : query,
          }) satisfies typeof state
      )
    })
    const appendToBottomAndFocusHook = runnerHooks.hook(
      'appendToBottomAndFocus',
      (query) => {
        runnerHooks.callHook('appendToBottom', query)
        window.requestAnimationFrame(() => {
          runnerHooks.callHook('scrollToBottom')
          runnerHooks.callHook('focus')
        })
      }
    )
    const focusRunnerHook = runnerHooks.hook('focus', (lineNumber) => {
      const editor = monacoRef.current
      if (!editor) {
        return
      }

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
      if (!editor) {
        return
      }

      editor.revealLineInCenter(lineNumber)
    })
    const scrollToBottomHook = runnerHooks.hook('scrollToBottom', () => {
      const editor = monacoRef.current
      if (!editor) {
        return
      }

      const lineCount = editor.getModel()?.getLineCount()

      if (lineCount) {
        editor.revealLineInCenter(lineCount)
      }
    })
    const replaceQueryHook = runnerHooks.hook(
      'replaceQuery',
      ({ query, startLineNumber, endLineNumber }) => {
        replaceEvent({ query, startLineNumber, endLineNumber })
      }
    )

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

export const RunnerEditor = () => {
  const { connection, connectionResource } = useRouteContext()
  const store = useRunnerPageStore()
  const editorQueriesStore = useEditorQueriesComputed()
  const monacoRef = useRef<editor.IStandaloneCodeEditor>(null)
  const { run } = useRunnerContext()

  const runEvent = useEffectEvent(run)

  useRunnerEditorHooks(monacoRef)
  useRunnerEditorQueryZones(monacoRef)
  useRunnerEditorAIZones(monacoRef)

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const editor = monacoRef.current
      if (!editor) {
        return
      }

      const model = editor.getModel()
      if (!model) {
        return
      }

      const nextQuery = store.get().query
      if (editor.getValue() === nextQuery) {
        return
      }

      editor.executeEdits('', [
        {
          range: model.getFullModelRange(),
          text: nextQuery,
          forceMoveMarkers: true,
        },
      ])
      editor.pushUndoStop()
    })

    return unsubscribe
  }, [store])

  useEffect(() => {
    setupLanguageFeatures(sqlDialects[connection.type], {
      completionItems: {
        enable: true,
        completionService: connectionCompletionService(connectionResource),
      },
    })
  }, [connection, connectionResource])

  const getEditorQueriesEvent = useEffectEvent(
    (position: Position) =>
      editorQueriesStore
        .get()
        .find(
          (query) =>
            position.lineNumber >= query.startLineNumber &&
            position.lineNumber <= query.endLineNumber
        ) ?? null
  )

  useEffect(() => {
    if (!monacoRef.current) {
      return
    }

    // Monaco keybindings are bit flags; bitwise OR is required by the API.
    // oxlint-disable-next-line no-bitwise
    const enterKeybinding = KeyMod.CtrlCmd | KeyCode.Enter

    const disposable = monacoRef.current?.addAction({
      id: 'tamery.execute-on-enter',
      label: 'Execute on Enter',
      keybindings: [enterKeybinding],
      run: (e) => {
        const position = e.getPosition()

        if (!position) {
          return
        }

        const editorQuery = getEditorQueriesEvent(position)

        if (!editorQuery) {
          return
        }

        const query = editorQuery.queries.at(-1)

        if (!query) {
          return
        }

        runEvent([
          {
            startLineNumber: editorQuery.startLineNumber,
            endLineNumber: editorQuery.endLineNumber,
            query,
          },
        ])
      },
    })

    return () => disposable.dispose()
  }, [])

  return (
    <Monaco
      data-mask
      ref={monacoRef}
      language={sqlDialects[connection.type]}
      value={store.get().query}
      onChange={(q) => {
        if (q === store.get().query) {
          return
        }
        store.set(
          (state) =>
            ({
              ...state,
              query: q,
            }) satisfies typeof state
        )
      }}
      className="size-full"
      options={MONACO_OPTIONS}
    />
  )
}
