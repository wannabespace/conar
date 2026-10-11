import type { Hotkey } from '@tanstack/react-hotkeys'
import { LETTER_KEYS, parseHotkey } from '@tanstack/react-hotkeys'
import type { editor } from 'monaco-editor'
import { KeyCode, KeyMod } from 'monaco-editor'
import type { RefObject } from 'react'
import { useEffect, useEffectEvent, useRef } from 'react'

import type { ShortcutId } from '~/core/keyboard/shortcuts'
import { SHORTCUTS } from '~/core/keyboard/shortcuts'

import type { RunnerActions } from './actions'

const AI_REVIEW_CONTEXT_KEY = 'tameryAiReview'
const FAILED_CONTEXT_KEY = 'tameryFailedStatement'

const EDITOR_ACTIONS = [
  { label: 'Run statement', name: 'runCurrent', shortcut: 'runStatement' },
  { label: 'Run all', name: 'runAll', shortcut: 'runAll' },
  { label: 'Save statement', name: 'saveCurrent', shortcut: 'saveStatement' },
  { label: 'Save all', name: 'saveAll', shortcut: 'saveTab' },
  { label: 'Edit with AI', name: 'askAi', shortcut: 'editWithAi' },
  {
    label: 'Fix with AI',
    name: 'fixAi',
    // Gated on a failed statement, so Monaco's own ⌘I (trigger suggest) answers everywhere else.
    precondition: FAILED_CONTEXT_KEY,
    shortcut: 'fixWithAi',
  },
  {
    label: 'Statement actions',
    name: 'openStatementMenu',
    shortcut: 'contextMenu',
  },
  {
    label: 'Reject AI edit',
    name: 'rejectAi',
    // An action's keybinding outranks Monaco's own Escape, so it must yield while one of its widgets is open.
    precondition: `${AI_REVIEW_CONTEXT_KEY} && !suggestWidgetVisible && !findWidgetVisible && !inlineSuggestionVisible && !parameterHintsVisible`,
    shortcut: 'stepBack',
  },
] as const

// Monaco swallows keys typed into it (and claims ⌘L), so the app's panel toggles are re-dispatched.
const APP_SHORTCUTS: ShortcutId[] = ['toggleNavigator', 'queryLogger', 'aiChat']

const MONACO_KEYS: Record<string, KeyCode> = {
  ...Object.fromEntries(
    [...LETTER_KEYS].map((letter) => [letter, KeyCode[`Key${letter}`]])
  ),
  '.': KeyCode.Period,
  Enter: KeyCode.Enter,
  Escape: KeyCode.Escape,
}

// Monaco keybindings are bit flags; bitwise OR is required by the API.
/* oxlint-disable no-bitwise */
const monacoKeybinding = (hotkey: Hotkey) => {
  // Parsed as macOS so Mod lands on meta, which is what Monaco's CtrlCmd means on every platform.
  const { alt, key, meta, shift } = parseHotkey(hotkey, 'mac')
  return (
    (meta ? KeyMod.CtrlCmd : 0) |
    (shift ? KeyMod.Shift : 0) |
    (alt ? KeyMod.Alt : 0) |
    (MONACO_KEYS[key] ?? KeyCode.Unknown)
  )
}
/* oxlint-enable no-bitwise */

const forwardToApp = (hotkey: Hotkey) => {
  const { alt, ctrl, key, meta, shift } = parseHotkey(hotkey)
  document.dispatchEvent(
    new KeyboardEvent('keydown', {
      altKey: alt,
      bubbles: true,
      code: `Key${key}`,
      ctrlKey: ctrl,
      key: key.toLowerCase(),
      metaKey: meta,
      shiftKey: shift,
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
      ...APP_SHORTCUTS.flatMap((shortcut) =>
        SHORTCUTS[shortcut].hotkeys.map((hotkey) =>
          codeEditor.addAction({
            id: `tamery.app-${hotkey}`,
            keybindings: [monacoKeybinding(hotkey)],
            label: SHORTCUTS[shortcut].title,
            run: () => forwardToApp(hotkey),
          })
        )
      ),
      ...EDITOR_ACTIONS.map(({ name, shortcut, ...action }) =>
        codeEditor.addAction({
          ...action,
          id: `tamery.${name}`,
          keybindings: SHORTCUTS[shortcut].hotkeys.map(monacoKeybinding),
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
