import {
  Cancel01Icon,
  PlayIcon,
  SaveIcon,
  SparklesIcon,
  ViewIcon,
  Tick02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { getOS } from '@tamery/shared/os'
import { statementAt } from '@tamery/sql'
import { Button } from '@tamery/ui/components/button'
import {
  KbdCtrlEnter,
  KbdCtrlLetter,
} from '@tamery/ui/components/custom/shortcuts'
import { Group } from '@tamery/ui/components/group'
import { Kbd } from '@tamery/ui/components/kbd'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { getRouteApi } from '@tanstack/react-router'
import type { editor } from 'monaco-editor'
import { editor as monacoEditor, KeyCode, KeyMod } from 'monaco-editor'
import type { RefObject } from 'react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'

import type { AppMenuNode } from '~/components/app-context-menu'
import { AppMenuButton } from '~/components/app-context-menu'
import { Monaco } from '~/components/monaco'
import { capabilitiesOf } from '~/entities/connection/capabilities'
import {
  attachGhostTextEscape,
  attachSqlDiagnostics,
  bindSqlModel,
  sqlLanguageIds,
} from '~/entities/connection/sql-language'

import type { RunnerActions } from '../-lib/actions'
import { useRunnerActions } from '../-lib/actions'
import {
  runnerStatements,
  setQuery,
  useRunnerPageStore,
  useRunnerTab,
} from '../-lib/store'

const { useRouteContext } = getRouteApi(
  '/_protected/connection/$resourceId/$tabId'
)

const MONACO_OPTIONS = {
  contextmenu: false,
  folding: false,
  // The accept/dismiss controls are ours, drawn beside the ghost text.
  inlineSuggest: { enabled: true, showToolbar: 'never' },
  lineNumbersMinChars: 3,
  padding: { top: 8 },
  // Monaco 0.56 defaults `other` to 'offWhenInlineCompletions', which holds the list back
  // until the AI ghost-text provider answers — a network round trip on every keystroke.
  quickSuggestions: { comments: 'off', other: 'on', strings: 'off' },
  quickSuggestionsDelay: 0,
  scrollBeyondLastLine: false,
  suggest: { showWords: false },
  wordWrap: 'on',
} satisfies editor.IStandaloneEditorConstructionOptions

const AI_REVIEW_CONTEXT_KEY = 'tameryAiReview'

// Monaco keybindings are bit flags; bitwise OR is required by the API.
/* oxlint-disable no-bitwise */
const KEYBINDINGS = {
  askAi: KeyMod.CtrlCmd | KeyCode.KeyK,
  // Monaco's own ⌘. is Quick Fix, which the SQL language never offers.
  openStatementMenu: KeyMod.CtrlCmd | KeyCode.Period,
  reject: KeyCode.Escape,
  runAll: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.Enter,
  runCurrent: KeyMod.CtrlCmd | KeyCode.Enter,
  saveAll: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyS,
  saveCurrent: KeyMod.CtrlCmd | KeyCode.KeyS,
}
/* oxlint-enable no-bitwise */

/**
 * Window-level shortcuts the editor would otherwise keep: Monaco claims ⌘L (expand line selection)
 * and swallows keys typed into it, so the navigator (⌘B), chat (⌘L) and query logger (⌘J) stopped
 * toggling while the cursor was in a query. The editor hands them back to the app's own listeners.
 */
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

const useEditorActions = (
  editorRef: RefObject<editor.IStandaloneCodeEditor | null>,
  actions: RunnerActions & {
    reviewing: boolean
    acceptAi: () => void
    rejectAi: () => void
    openStatementMenu: () => void
  }
) => {
  const invoke = useEffectEvent(
    (
      name:
        | 'runCurrent'
        | 'runAll'
        | 'saveCurrent'
        | 'saveAll'
        | 'askAi'
        | 'rejectAi'
        | 'openStatementMenu'
    ) =>
      name === 'runCurrent' && actions.reviewing
        ? actions.acceptAi()
        : actions[name]()
  )

  const reviewKeyRef = useRef<editor.IContextKey<boolean>>(null)

  useEffect(() => {
    const codeEditor = editorRef.current
    if (!codeEditor) {
      return
    }
    const reviewKey = codeEditor.createContextKey(AI_REVIEW_CONTEXT_KEY, false)
    reviewKeyRef.current = reviewKey
    const register = (
      id: string,
      label: string,
      keybinding: number,
      run: () => void,
      precondition?: string
    ) =>
      codeEditor.addAction({
        id: `tamery.${id}`,
        keybindings: [keybinding],
        label,
        precondition,
        run,
      })
    const disposables = [
      ...APP_SHORTCUTS.map(({ keyCode, letter }) =>
        register(
          `app-${letter}`,
          `Toggle panel (${letter.toUpperCase()})`,
          // oxlint-disable-next-line no-bitwise -- Monaco keybindings are bit flags
          KeyMod.CtrlCmd | keyCode,
          () => forwardToApp(letter)
        )
      ),
      register('run-current', 'Run statement', KEYBINDINGS.runCurrent, () =>
        invoke('runCurrent')
      ),
      register('run-all', 'Run all', KEYBINDINGS.runAll, () =>
        invoke('runAll')
      ),
      register('save-current', 'Save statement', KEYBINDINGS.saveCurrent, () =>
        invoke('saveCurrent')
      ),
      register('save-all', 'Save all', KEYBINDINGS.saveAll, () =>
        invoke('saveAll')
      ),
      register('ask-ai', 'Edit with AI', KEYBINDINGS.askAi, () =>
        invoke('askAi')
      ),
      register(
        'statement-menu',
        'Statement actions',
        KEYBINDINGS.openStatementMenu,
        () => invoke('openStatementMenu')
      ),
      register(
        'reject-ai',
        'Reject AI edit',
        KEYBINDINGS.reject,
        () => invoke('rejectAi'),
        AI_REVIEW_CONTEXT_KEY
      ),
    ]
    return () => {
      for (const disposable of disposables) {
        disposable.dispose()
      }
      reviewKey.reset()
    }
  }, [editorRef])

  useEffect(() => {
    reviewKeyRef.current?.set(actions.reviewing)
  }, [actions.reviewing])
}

/** Paints the band under the caret's statement and reports where its first line sits, for the run button. */
// Injected after the statement's last line so typed text pushes the Run button along instead of running under it.
const RUN_SLOT = '\u00A0'.repeat(8)
const RUN_SLOT_GAP = 12
// Sync with the kit button's `icon-2xs` height; a translate would fight the press nudge.
const RUN_BUTTON_HEIGHT = 18
const RUN_SLOT_CLASS = 'sql-run-slot'

// Monaco's own classes for inline-completion ghost text: inline spans on the caret's line, then a
// block for further lines. The controls trail the piece drawn last — lowest, then rightmost.
const ghostText = (codeEditor: editor.IStandaloneCodeEditor) =>
  [
    ...(codeEditor.getDomNode()?.querySelectorAll(
      // `-preview` is the variant drawn while the suggestion list is open beside it.
      '.ghost-text-decoration, .ghost-text-decoration-preview, .ghost-text'
    ) ?? []),
  ]
    .map((element) => ({ element, rect: element.getBoundingClientRect() }))
    .filter(({ rect }) => rect.width > 0)
    .toSorted(
      (a, b) => a.rect.bottom - b.rect.bottom || a.rect.right - b.rect.right
    )
    .at(-1)?.element ?? null

interface RunAnchor {
  top: number
  left: number
  /** The anchor trails an AI ghost suggestion, which the controls then offer to accept. */
  suggestion: boolean
}

/** The inline group's ⋯ menu: every statement action but Run, which keeps its own button. */
const statementMenuItems = (
  actions: RunnerActions,
  canExplain: boolean
): AppMenuNode[] => [
  ...(canExplain
    ? [
        {
          icon: ViewIcon,
          label: 'Explain',
          onSelect: () => actions.explainCurrent(),
        },
      ]
    : []),
  {
    accelerator: 'CmdOrCtrl+K',
    icon: SparklesIcon,
    label: 'Edit with AI',
    onSelect: () => actions.askAi(),
    shortcut: <KbdCtrlLetter userAgent={navigator.userAgent} letter="K" />,
  },
  {
    accelerator: 'CmdOrCtrl+S',
    icon: SaveIcon,
    label: 'Save statement',
    onSelect: () => actions.saveCurrent(),
    shortcut: <KbdCtrlLetter userAgent={navigator.userAgent} letter="S" />,
  },
]

/**
 * Opens a menu trigger from a shortcut and hands it the keyboard. Monaco keeps focus in its own
 * input after running an action, so the popup is focused explicitly or arrows keep moving the caret.
 */
const openMenuFromKeyboard = (trigger: HTMLButtonElement | null) => {
  if (!trigger) {
    return
  }
  // The trigger names its popup only once the menu has rendered open.
  const observer = new MutationObserver(() => {
    const id = trigger.getAttribute('aria-controls')
    if (id) {
      observer.disconnect()
      document.querySelector<HTMLElement>(`#${CSS.escape(id)}`)?.focus()
    }
  })
  observer.observe(trigger, { attributeFilter: ['aria-controls'] })
  trigger.click()
}

const useStatementBand = (
  editorRef: RefObject<editor.IStandaloneCodeEditor | null>,
  onMove: (anchor: RunAnchor | null) => void
) => {
  const move = useEffectEvent(onMove)
  const { connection } = useRouteContext()
  const statements = runnerStatements({
    ...useRunnerTab(),
    connectionType: connection.type,
  })

  useEffect(() => {
    const codeEditor = editorRef.current
    if (!codeEditor) {
      return
    }
    const band = codeEditor.createDecorationsCollection()
    let frame = 0

    // The slot may wrap to its own visual row and the ghost text re-renders as it streams in,
    // so read where Monaco actually drew whichever anchors the controls.
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const suggestion = ghostText(codeEditor)
        const slot = codeEditor
          .getDomNode()
          ?.querySelector(`.${RUN_SLOT_CLASS}`)
        const root = codeEditor.getDomNode()?.getBoundingClientRect()
        const rect = (suggestion ?? slot)?.getBoundingClientRect()
        move(
          root && rect
            ? {
                left: (suggestion ? rect.right : rect.left) - root.left,
                suggestion: suggestion !== null,
                top:
                  rect.top + (rect.height - RUN_BUTTON_HEIGHT) / 2 - root.top,
              }
            : null
        )
      })
    }

    const paint = () => {
      const model = codeEditor.getModel()
      const position = codeEditor.getPosition()
      if (!model || !position) {
        return
      }
      const statement = statementAt(
        statements.get(),
        model.getOffsetAt(position),
        model.getValue()
      )
      // Monaco paints a selection across injected text, so the slot and button step aside while one exists.
      if (!statement || !codeEditor.getSelection()?.isEmpty()) {
        cancelAnimationFrame(frame)
        move(null)
        band.clear()
        return
      }
      const startLine = model.getPositionAt(statement.start).lineNumber
      const endLine = model.getPositionAt(statement.terminatorEnd).lineNumber
      const endColumn = model.getLineMaxColumn(endLine)
      const ghost = ghostText(codeEditor)
      band.set([
        {
          options: { className: 'sql-active-band', isWholeLine: true },
          range: {
            endColumn: 1,
            endLineNumber: endLine,
            startColumn: 1,
            startLineNumber: startLine,
          },
        },
        // Ghost text renders after injected text at the same column, so the slot yields to it
        // and the button follows the suggestion instead.
        ...(ghost
          ? []
          : [
              {
                options: {
                  after: {
                    content: RUN_SLOT,
                    // The caret never lands past the slot, so a click beyond the button still types before it.
                    cursorStops: monacoEditor.InjectedTextCursorStops.Left,
                    inlineClassName: RUN_SLOT_CLASS,
                  },
                  showIfCollapsed: true,
                },
                range: {
                  endColumn,
                  endLineNumber: endLine,
                  startColumn: endColumn,
                  startLineNumber: endLine,
                },
              },
            ]),
      ])
      measure()
    }

    paint()
    const unsubscribe = statements.subscribe(paint)
    const cursorListener = codeEditor.onDidChangeCursorSelection(paint)
    const scrollListener = codeEditor.onDidScrollChange(paint)
    const layoutListener = codeEditor.onDidLayoutChange(paint)
    // View zones (the AI card) shift lines without a cursor, scroll or layout event.
    const sizeListener = codeEditor.onDidContentSizeChange(paint)
    // Ghost text comes and goes with no editor event of its own.
    let hadGhost = false
    const ghostObserver = new MutationObserver(() => {
      const hasGhost = ghostText(codeEditor) !== null
      if (hasGhost !== hadGhost) {
        hadGhost = hasGhost
        paint()
      } else if (hasGhost) {
        measure()
      }
    })
    const root = codeEditor.getDomNode()
    if (root) {
      // No `attributes`: the caret blink rewrites a style attribute twice a second.
      ghostObserver.observe(root, {
        characterData: true,
        childList: true,
        subtree: true,
      })
    }

    return () => {
      unsubscribe()
      cursorListener.dispose()
      scrollListener.dispose()
      layoutListener.dispose()
      sizeListener.dispose()
      ghostObserver.disconnect()
      cancelAnimationFrame(frame)
      band.clear()
    }
  }, [editorRef, statements])
}

export const RunnerEditor = ({
  editorRef,
  editing,
  reviewing,
  acceptAi,
  rejectAi,
}: {
  editorRef: RefObject<editor.IStandaloneCodeEditor | null>
  /** An AI prompt or rewrite card is open — the inline Run button steps aside for it. */
  editing: boolean
  reviewing: boolean
  acceptAi: () => void
  rejectAi: () => void
}) => {
  const { connection, connectionResource } = useRouteContext()
  const store = useRunnerPageStore()
  const query = useSubscription(store, { selector: (state) => state.query })
  const actions = useRunnerActions()

  const [runAnchor, setRunAnchor] = useState<RunAnchor | null>(null)
  // The ⋯ trigger opens its own menu on click, native or web, and the web menu takes arrow keys.
  const statementMenuRef = useRef<HTMLButtonElement>(null)
  useEditorActions(editorRef, {
    ...actions,
    acceptAi,
    openStatementMenu: () => openMenuFromKeyboard(statementMenuRef.current),
    rejectAi,
    reviewing,
  })
  useStatementBand(editorRef, (anchor) =>
    setRunAnchor((current) =>
      current?.left === anchor?.left &&
      current?.top === anchor?.top &&
      current?.suggestion === anchor?.suggestion
        ? current
        : anchor
    )
  )

  useEffect(() => {
    const codeEditor = editorRef.current
    const model = codeEditor?.getModel()
    if (!codeEditor || !model) {
      return
    }
    bindSqlModel(model, connectionResource)
    const detachDiagnostics = attachSqlDiagnostics(
      codeEditor,
      connectionResource,
      connection.type
    )
    const detachEscape = attachGhostTextEscape(codeEditor)
    return () => {
      detachDiagnostics()
      detachEscape()
    }
  }, [editorRef, connectionResource, connection.type])

  return (
    <div className="relative size-full">
      <Monaco
        data-mask
        ref={editorRef}
        language={sqlLanguageIds[connection.type]}
        value={query}
        onChange={(next) => setQuery(store, next)}
        className="size-full"
        options={MONACO_OPTIONS}
      />
      {runAnchor && !editing && (
        <Group
          className="absolute"
          style={{ left: runAnchor.left + RUN_SLOT_GAP, top: runAnchor.top }}
        >
          {runAnchor.suggestion && (
            <>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      size="icon-2xs"
                      aria-label="Accept suggestion"
                      onClick={() =>
                        editorRef.current?.trigger(
                          'runner',
                          'editor.action.inlineSuggest.commit',
                          null
                        )
                      }
                    />
                  }
                >
                  <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} />
                </TooltipTrigger>
                <TooltipContent>
                  Accept suggestion
                  <Kbd>Tab</Kbd>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      size="icon-2xs"
                      variant="outline"
                      aria-label="Dismiss suggestion"
                      onClick={() =>
                        editorRef.current?.trigger(
                          'runner',
                          'editor.action.inlineSuggest.hide',
                          null
                        )
                      }
                    />
                  }
                >
                  <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                </TooltipTrigger>
                <TooltipContent>
                  Dismiss suggestion
                  <Kbd>Esc</Kbd>
                </TooltipContent>
              </Tooltip>
            </>
          )}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="icon-2xs"
                  variant="outline"
                  aria-label="Run statement"
                  onClick={() => actions.runCurrent()}
                />
              }
            >
              <HugeiconsIcon icon={PlayIcon} strokeWidth={2} />
            </TooltipTrigger>
            <TooltipContent>
              Run statement
              <KbdCtrlEnter userAgent={navigator.userAgent} />
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <AppMenuButton
              render={
                <TooltipTrigger
                  render={
                    <Button
                      ref={statementMenuRef}
                      size="icon-2xs"
                      variant="outline"
                    />
                  }
                />
              }
              contentProps={{ align: 'start' }}
              items={() =>
                statementMenuItems(
                  actions,
                  capabilitiesOf(connection.type).explain
                )
              }
            />
            <TooltipContent>
              More actions
              <KbdCtrlLetter userAgent={navigator.userAgent} letter="." />
            </TooltipContent>
          </Tooltip>
        </Group>
      )}
    </div>
  )
}
