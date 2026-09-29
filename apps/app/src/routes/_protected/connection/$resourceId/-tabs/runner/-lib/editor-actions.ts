import { getOS } from '@tamery/shared/os'
import type { editor } from 'monaco-editor'
import { KeyCode, KeyMod } from 'monaco-editor'
import type { RefObject } from 'react'
import { useEffect, useEffectEvent, useRef } from 'react'

import type { RunnerActions } from './actions'

const AI_REVIEW_CONTEXT_KEY = 'tameryAiReview'
const FAILED_CONTEXT_KEY = 'tameryFailedStatement'

// Monaco keybindings are bit flags; bitwise OR is required by the API.
/* oxlint-disable no-bitwise */
const EDITOR_ACTIONS = [
  {
    keybinding: KeyMod.CtrlCmd | KeyCode.Enter,
    label: 'Run statement',
    name: 'runCurrent',
  },
  {
    keybinding: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.Enter,
    label: 'Run all',
    name: 'runAll',
  },
  {
    keybinding: KeyMod.CtrlCmd | KeyCode.KeyS,
    label: 'Save statement',
    name: 'saveCurrent',
  },
  {
    keybinding: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyS,
    label: 'Save all',
    name: 'saveAll',
  },
  {
    keybinding: KeyMod.CtrlCmd | KeyCode.KeyK,
    label: 'Edit with AI',
    name: 'askAi',
  },
  {
    // Gated on a failed statement, so Monaco's own ⌘I (trigger suggest) answers everywhere else.
    keybinding: KeyMod.CtrlCmd | KeyCode.KeyI,
    label: 'Fix with AI',
    name: 'fixAi',
    precondition: FAILED_CONTEXT_KEY,
  },
  {
    keybinding: KeyMod.CtrlCmd | KeyCode.Period,
    label: 'Statement actions',
    name: 'openStatementMenu',
  },
  {
    keybinding: KeyCode.Escape,
    label: 'Reject AI edit',
    name: 'rejectAi',
    precondition: AI_REVIEW_CONTEXT_KEY,
  },
] as const
/* oxlint-enable no-bitwise */

// Monaco swallows keys typed into it (and claims ⌘L), so the app's panel toggles are re-dispatched.
const APP_SHORTCUTS = [
  { keyCode: KeyCode.KeyB, letter: 'b' },
  { keyCode: KeyCode.KeyJ, letter: 'j' },
  { keyCode: KeyCode.KeyL, letter: 'l' },
]

const forwardToApp = (letter: string) => {
  const mac = getOS(navigator.userAgent).type === 'macos'
  document.dispatchEvent(
    new KeyboardEvent('keydown', {
      bubbles: true,
      code: `Key${letter.toUpperCase()}`,
      ctrlKey: !mac,
      key: letter,
      metaKey: mac,
    })
  )
}

export const useEditorActions = (
  editorRef: RefObject<editor.IStandaloneCodeEditor | null>,
  actions: RunnerActions & {
    reviewing: boolean
    failing: boolean
    fixAi: () => void
    acceptAi: () => void
    rejectAi: () => void
    openStatementMenu: () => void
  }
) => {
  const invoke = useEffectEvent(
    (name: (typeof EDITOR_ACTIONS)[number]['name']) =>
      name === 'runCurrent' && actions.reviewing
        ? actions.acceptAi()
        : actions[name]()
  )

  const reviewKeyRef = useRef<editor.IContextKey<boolean>>(null)
  const failedKeyRef = useRef<editor.IContextKey<boolean>>(null)

  useEffect(() => {
    const codeEditor = editorRef.current
    if (!codeEditor) {
      return
    }
    const reviewKey = codeEditor.createContextKey(AI_REVIEW_CONTEXT_KEY, false)
    reviewKeyRef.current = reviewKey
    const failedKey = codeEditor.createContextKey(FAILED_CONTEXT_KEY, false)
    failedKeyRef.current = failedKey
    const disposables = [
      ...APP_SHORTCUTS.map(({ keyCode, letter }) =>
        codeEditor.addAction({
          id: `tamery.app-${letter}`,
          // oxlint-disable-next-line no-bitwise -- Monaco keybindings are bit flags
          keybindings: [KeyMod.CtrlCmd | keyCode],
          label: `Toggle panel (${letter.toUpperCase()})`,
          run: () => forwardToApp(letter),
        })
      ),
      ...EDITOR_ACTIONS.map(({ keybinding, name, ...action }) =>
        codeEditor.addAction({
          ...action,
          id: `tamery.${name}`,
          keybindings: [keybinding],
          run: () => invoke(name),
        })
      ),
    ]
    return () => {
      for (const disposable of disposables) {
        disposable.dispose()
      }
      reviewKey.reset()
      failedKey.reset()
    }
  }, [editorRef])

  useEffect(() => {
    reviewKeyRef.current?.set(actions.reviewing)
  }, [actions.reviewing])

  useEffect(() => {
    failedKeyRef.current?.set(actions.failing)
  }, [actions.failing])
}
