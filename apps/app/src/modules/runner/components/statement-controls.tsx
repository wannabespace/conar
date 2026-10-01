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
import { acceptGhostText, dismissGhostText } from '@tamery/monaco/sql-language'
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
import type { RefObject } from 'react'

import { AppMenuButton } from '~/components/app-context-menu'
import type { AppMenuNode } from '~/components/app-menu'
import { capabilitiesOf } from '~/core/catalog/capabilities'

import type { RunnerActions } from '../lib/actions'
import { useRunnerActions } from '../lib/actions'
import type { RunnerResult } from '../lib/run'
import type { RunAnchor } from '../lib/statement-band'
import { RUN_SLOT_GAP, sameSpot } from '../lib/statement-band'

const { useRouteContext } = getRouteApi(
  '/_protected/connection/$resourceId/$tabId'
)

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
export const openMenuFromKeyboard = (trigger: HTMLButtonElement | null) => {
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
            onClick={() => {
              const codeEditor = editorRef.current
              if (codeEditor) {
                acceptGhostText(codeEditor)
                codeEditor.focus()
              }
            }}
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
            onClick={() => {
              const codeEditor = editorRef.current
              if (codeEditor) {
                dismissGhostText(codeEditor)
                codeEditor.focus()
              }
            }}
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

export const StatementControls = ({
  anchor,
  editorRef,
  failed,
  menuRef,
}: {
  anchor: RunAnchor
  editorRef: RefObject<editor.IStandaloneCodeEditor | null>
  failed: (RunnerResult & { error: string }) | undefined
  menuRef: RefObject<HTMLButtonElement | null>
}) => {
  const { connection } = useRouteContext()
  const actions = useRunnerActions()
  const suggestionHere = sameSpot(anchor.suggestion, anchor)

  return (
    <>
      {anchor.suggestion && !suggestionHere && (
        <div
          className="absolute"
          style={{
            left: anchor.suggestion.left + RUN_SLOT_GAP,
            top: anchor.suggestion.top,
          }}
        >
          <SuggestionControls editorRef={editorRef} />
        </div>
      )}
      <div
        className="absolute flex gap-1.5"
        style={{ left: anchor.left + RUN_SLOT_GAP, top: anchor.top }}
      >
        {anchor.suggestion && suggestionHere && (
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
                    <Button ref={menuRef} size="icon-2xs" variant="outline" />
                  }
                />
              }
              className="text-foreground"
              contentProps={{
                align: 'start',
                finalFocus: () => editorRef.current?.focus(),
              }}
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
    </>
  )
}
