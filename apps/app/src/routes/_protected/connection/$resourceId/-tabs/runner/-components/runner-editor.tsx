import {
  AiIdeaIcon,
  Cancel01Icon,
  PlayIcon,
  SaveIcon,
  SparklesIcon,
  ViewIcon,
  Tick02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Monaco } from '@tamery/monaco/editor'
import {
  attachGhostTextEscape,
  attachSqlDiagnostics,
  bindSqlModel,
  GHOST_TEXT_SELECTOR,
  sqlLanguageIds,
} from '@tamery/monaco/sql-language'
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
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type { editor } from 'monaco-editor'
import { editor as monacoEditor, KeyCode, KeyMod } from 'monaco-editor'
import type { RefObject } from 'react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'

import type { AppMenuNode } from '~/components/app-context-menu'
import { AppMenuButton } from '~/components/app-context-menu'
import { capabilitiesOf } from '~/entities/connection/capabilities'
import { sqlSourceFor } from '~/entities/connection/sql-source'

import type { RunnerActions } from '../-lib/actions'
import { useRunnerActions } from '../-lib/actions'
import type { RunnerResult } from '../-lib/run'
import { runnerResultsOptions } from '../-lib/run'
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
  inlineSuggest: {
    enabled: true,
    // The accept/dismiss controls are ours, drawn beside the ghost text.
    showToolbar: 'never',
    // Untyped in 0.56's d.ts. Without it, focusing a list row hides ghost text that does not extend the row.
    ...({ experimental: { showOnSuggestConflict: 'always' } } as object),
  },
  lineNumbersMinChars: 3,
  // `other` defaults to 'offWhenInlineCompletions': the list would wait on the AI ghost-text request.
  quickSuggestions: { comments: 'off', other: 'on', strings: 'off' },
  quickSuggestionsDelay: 0,
  renderLineHighlight: 'none',
  scrollBeyondLastLine: false,
  // `preview` stays off: the row's own preview draws as ghost text and would read as an AI suggestion.
  suggest: {
    preview: false,
    selectionMode: 'whenQuickSuggestion',
    showWords: false,
  },
  wordWrap: 'on',
} satisfies editor.IStandaloneEditorConstructionOptions

const AI_REVIEW_CONTEXT_KEY = 'tameryAiReview'
const FAILED_CONTEXT_KEY = 'tameryFailedStatement'

// Monaco keybindings are bit flags; bitwise OR is required by the API.
/* oxlint-disable no-bitwise */
const KEYBINDINGS = {
  askAi: KeyMod.CtrlCmd | KeyCode.KeyK,
  // Gated on a failed statement, so Monaco's own ⌘I (trigger suggest) answers everywhere else.
  fixAi: KeyMod.CtrlCmd | KeyCode.KeyI,
  // Monaco's own ⌘. is Quick Fix, which the SQL language never offers.
  openStatementMenu: KeyMod.CtrlCmd | KeyCode.Period,
  reject: KeyCode.Escape,
  runAll: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.Enter,
  runCurrent: KeyMod.CtrlCmd | KeyCode.Enter,
  saveAll: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyS,
  saveCurrent: KeyMod.CtrlCmd | KeyCode.KeyS,
}
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

const useEditorActions = (
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
    (
      name:
        | 'runCurrent'
        | 'runAll'
        | 'saveCurrent'
        | 'saveAll'
        | 'askAi'
        | 'fixAi'
        | 'rejectAi'
        | 'openStatementMenu'
    ) =>
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
        'fix-ai',
        'Fix with AI',
        KEYBINDINGS.fixAi,
        () => invoke('fixAi'),
        FAILED_CONTEXT_KEY
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

// Injected after the statement's last line so typed text pushes the Run button along instead of running under it.
const RUN_SLOT = '\u00A0'.repeat(8)
const RUN_SLOT_GAP = 12
// Sync with the kit button's `icon-2xs` height; a translate would fight the press nudge.
const RUN_BUTTON_HEIGHT = 20
const RUN_SLOT_CLASS = 'sql-run-slot'

// The controls trail the ghost-text piece drawn last: lowest, then rightmost.
const ghostText = (codeEditor: editor.IStandaloneCodeEditor) =>
  [...(codeEditor.getDomNode()?.querySelectorAll(GHOST_TEXT_SELECTOR) ?? [])]
    .map((element) => ({ element, rect: element.getBoundingClientRect() }))
    .filter(({ rect }) => rect.width > 0)
    .toSorted(
      (a, b) => a.rect.bottom - b.rect.bottom || a.rect.right - b.rect.right
    )
    .at(-1)?.element ?? null

interface RunAnchor {
  top: number
  left: number
  /** The caret's statement, matched against the last run by start and source. */
  start: number
  source: string
  suggestion: { left: number; top: number } | null
}

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

// Monaco keeps focus after running an action, so the popup is focused explicitly or arrows move the caret.
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
    let active = { source: '', start: 0 }

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
        if (!root) {
          return
        }
        const spot = (rect: DOMRect, left: number) => ({
          left: left - root.left,
          top: rect.top + (rect.height - RUN_BUTTON_HEIGHT) / 2 - root.top,
        })
        const suggestionRect = suggestion?.getBoundingClientRect()
        const suggestionSpot = suggestionRect
          ? spot(suggestionRect, suggestionRect.right)
          : null
        const slotRect = slot?.getBoundingClientRect()
        const statementSpot = slotRect
          ? spot(slotRect, slotRect.left)
          : suggestionSpot
        move(
          statementSpot
            ? { ...active, ...statementSpot, suggestion: suggestionSpot }
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
      active = { source: statement.text, start: statement.start }
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
        // Ghost text at the statement's end renders after injected text at the same column, so the
        // slot yields to it and the buttons follow the suggestion; mid-line ghost text keeps the slot.
        ...(ghost &&
        position.lineNumber === endLine &&
        position.column === endColumn
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

const SuggestionControls = ({
  editorRef,
}: {
  editorRef: RefObject<editor.IStandaloneCodeEditor | null>
}) => (
  <Group>
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
  </Group>
)

const sameSpot = (
  a: { left: number; top: number } | null | undefined,
  b: { left: number; top: number } | null | undefined
) => a?.left === b?.left && a?.top === b?.top

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
  const { data: run } = useQuery(runnerResultsOptions(useRunnerTab()))

  const [runAnchor, setRunAnchor] = useState<RunAnchor | null>(null)
  const statementMenuRef = useRef<HTMLButtonElement>(null)
  const suggestionHere = sameSpot(runAnchor?.suggestion, runAnchor)

  const failed = runAnchor
    ? run?.results.find(
        (result): result is RunnerResult & { error: string } =>
          result.error !== null &&
          result.start === runAnchor.start &&
          result.source === runAnchor.source
      )
    : undefined

  useEditorActions(editorRef, {
    ...actions,
    acceptAi,
    failing: failed !== undefined,
    fixAi: () => failed && actions.fixWithAi(failed),
    openStatementMenu: () => openMenuFromKeyboard(statementMenuRef.current),
    rejectAi,
    reviewing,
  })
  useStatementBand(editorRef, (anchor) =>
    setRunAnchor((current) =>
      sameSpot(current, anchor) &&
      sameSpot(current?.suggestion, anchor?.suggestion) &&
      current?.start === anchor?.start &&
      current?.source === anchor?.source
        ? current
        : anchor
    )
  )

  useEffect(() => {
    editorRef.current?.focus()
  }, [editorRef])

  useEffect(() => {
    const codeEditor = editorRef.current
    const model = codeEditor?.getModel()
    if (!codeEditor || !model) {
      return
    }
    const source = sqlSourceFor(connectionResource, connection.type)
    bindSqlModel(model, source)
    const detachDiagnostics = attachSqlDiagnostics(codeEditor, source)
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
      {runAnchor?.suggestion && !suggestionHere && !editing && (
        <div
          className="absolute"
          style={{
            left: runAnchor.suggestion.left + RUN_SLOT_GAP,
            top: runAnchor.suggestion.top,
          }}
        >
          <SuggestionControls editorRef={editorRef} />
        </div>
      )}
      {runAnchor && !editing && (
        <div
          className="absolute flex gap-1.5"
          style={{ left: runAnchor.left + RUN_SLOT_GAP, top: runAnchor.top }}
        >
          {runAnchor.suggestion && suggestionHere && (
            <SuggestionControls editorRef={editorRef} />
          )}
          <Group>
            {failed && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      size="icon-2xs"
                      variant="outline"
                      aria-label="Fix with AI"
                      onClick={() => actions.fixWithAi(failed)}
                    />
                  }
                >
                  <HugeiconsIcon
                    icon={AiIdeaIcon}
                    strokeWidth={2}
                    className="size-3"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  Fix with AI
                  <KbdCtrlLetter userAgent={navigator.userAgent} letter="I" />
                </TooltipContent>
              </Tooltip>
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
                className="text-foreground"
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
        </div>
      )}
    </div>
  )
}
