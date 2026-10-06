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
import type { CSSProperties, RefObject } from 'react'

import { AppMenuButton } from '~/components/app-context-menu'
import type { AppMenuNode } from '~/components/app-menu'
import { capabilitiesOf } from '~/core/catalog/capabilities'
import { useIsAnonymous } from '~/lib/auth'

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
    <Tooltip shortcut={<Kbd>Tab</Kbd>}>
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
      <TooltipContent>Accept suggestion</TooltipContent>
    </Tooltip>
    <Tooltip shortcut={<Kbd>Esc</Kbd>}>
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
      <TooltipContent>Dismiss suggestion</TooltipContent>
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
  const isAnonymous = useIsAnonymous()
  const suggestionHere = sameSpot(anchor.suggestion, anchor)

  return (
    <>
      {anchor.suggestion && !suggestionHere && (
        <div
          className="absolute top-(--top) left-(--left)"
          style={
            {
              '--left': `${anchor.suggestion.left + RUN_SLOT_GAP}px`,
              '--top': `${anchor.suggestion.top}px`,
            } as CSSProperties
          }
        >
          <SuggestionControls editorRef={editorRef} />
        </div>
      )}
      <div
        className="absolute top-(--top) left-(--left) flex gap-1.5"
        style={
          {
            '--left': `${anchor.left + RUN_SLOT_GAP}px`,
            '--top': `${anchor.top}px`,
          } as CSSProperties
        }
      >
        {anchor.suggestion && suggestionHere && (
          <SuggestionControls editorRef={editorRef} />
        )}
        <Group>
          {failed && (
            <Tooltip
              shortcut={
                <KbdCtrlLetter userAgent={navigator.userAgent} letter="I" />
              }
            >
              <TooltipTrigger
                render={
                  <Button
                    size="icon-2xs"
                    variant="outline"
                    aria-label="Fix with AI"
                    className={isAnonymous ? 'opacity-50' : undefined}
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
              <TooltipContent>Fix with AI</TooltipContent>
            </Tooltip>
          )}
          <Tooltip shortcut={<KbdCtrlEnter userAgent={navigator.userAgent} />}>
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
            <TooltipContent>Run statement</TooltipContent>
          </Tooltip>
          <Tooltip
            shortcut={
              <KbdCtrlLetter userAgent={navigator.userAgent} letter="." />
            }
          >
            <AppMenuButton
              render={
                <TooltipTrigger
                  render={
                    <Button ref={menuRef} size="icon-2xs" variant="outline" />
                  }
                />
              }
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
            <TooltipContent>More actions</TooltipContent>
          </Tooltip>
        </Group>
      </div>
    </>
  )
}
