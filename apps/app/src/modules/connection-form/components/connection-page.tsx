import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { ConnectionPatch } from '@tamery/connection/diagnose'
import type { GuessFix, GuessFormat } from '@tamery/connection/guess'
import { Button } from '@tamery/ui/components/button'
import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import { FieldGroup } from '@tamery/ui/components/field'
import { Form } from '@tamery/ui/components/tanstack-form'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useSelector } from '@tanstack/react-form'
import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import { ShortcutKbd } from '~/core/keyboard/shortcut-kbd'
import { useShortcut } from '~/core/keyboard/use-shortcuts'
import { posthog } from '~/lib/posthog'

import type { ConnectionFormValues } from '../lib/connection-form'
import { missingOf, partsOf, useConnectionForm } from '../lib/connection-form'
import { useGoBack } from '../lib/use-go-back'
import { usePasteConnection } from '../lib/use-paste-connection'
import type { FormMode, Persist } from '../lib/use-save-connection'
import { lockedFieldOf, useSaveConnection } from '../lib/use-save-connection'
import { AgentPanel } from './agent-panel'
import { ColorField } from './color-field'
import { DropOverlay } from './drop-overlay'
import { FormFooter } from './form-footer'
import { LabelField } from './label-field'
import { NameField } from './name-field'
import { PageColumns } from './page-columns'
import { PasteHero } from './paste-hero'
import { PasteNotes } from './paste-notes'
import { Reveal } from './reveal'
import { ServerFields } from './server-fields'
import { SshFields } from './ssh-fields'
import { SyncField } from './sync-field'
import type { FixSource } from './test-alert'
import { TestAlert } from './test-alert'

// Defers to the next tick so a field the same update reveals has mounted.
const focusField = (id: string) =>
  setTimeout(
    () => document.querySelector<HTMLElement>(`#${CSS.escape(id)}`)?.focus(),
    0
  )

export const ConnectionPage = ({
  defaultValues,
  mode,
  persist,
}: {
  defaultValues?: ConnectionFormValues
  mode: FormMode
  persist: Persist
}) => {
  const goBack = useGoBack()
  const [filled, setFilled] = useState<{
    fixes: GuessFix[]
    origin?: GuessFormat
  }>()
  const [stage, setStage] = useState<'agent' | 'form'>('form')
  const pageRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const back = () => {
    if (stage === 'agent') {
      setStage('form')
    } else {
      goBack()
    }
  }
  // A focused control that unmounts (a fix button, Ask AI) drops focus to body, where the page's keys no longer reach.
  const keepFocusInPage = () =>
    setTimeout(() => {
      if (document.activeElement === document.body) {
        pageRef.current?.focus()
      }
    }, 0)
  const { draftOf, runTest, save, testError } = useSaveConnection(mode, persist)
  const locked = lockedFieldOf(mode)
  const scope = mode.kind === 'edit' ? mode.scope : 'all'

  const { form, paste, patch } = useConnectionForm({
    defaultValues,
    onFill: ({ fixes, format }, pasted) => {
      setFilled((current) => ({
        fixes,
        origin: pasted ? format : current?.origin,
      }))
    },
    onSubmit: () => save(form, filled?.origin),
  })
  // From the second attempt TanStack Form runs `onSubmit` even while one is in flight, so a press during a save is dropped here.
  const submit = () => {
    if (!form.state.isSubmitting) {
      formRef.current?.requestSubmit()
    }
  }

  const { dragging, flash, readClipboard } = usePasteConnection({
    onPaste: (guess, via) => {
      if (scope === 'credentials') {
        return
      }
      paste(guess, via)
      setStage('form')
      const [missing] = missingOf(form.state.values)
      if (missing) {
        focusField(missing)
      }
    },
    pitchShown: stage === 'form' && scope !== 'credentials',
  })

  const values = useSelector(form.store, (state) => state.values)
  const submitting = useSelector(form.store, (state) => state.isSubmitting)
  const { canSend, reason, testStatus } = draftOf(values)

  const applyFix = (fix: ConnectionPatch, source: FixSource) => {
    posthog.capture('connection_fix_applied', {
      fields: Object.entries(fix)
        .flatMap(([field, value]) => (value === undefined ? [] : [field]))
        .toSorted()
        .join(','),
      source,
    })
    patch(fix)
    if (fix.sshEnabled) {
      focusField('ssh.host')
      return
    }
    keepFocusInPage()
    void runTest(form.state.values)
  }

  useEffect(() => {
    pageRef.current?.focus()
  }, [])

  // Bound on the page, which sits inside React's root: the listener runs before a focused control's own keydown (the SSH switch toggles on Enter) and stops it.
  useShortcut('submit', submit, {
    enabled: stage === 'form',
    requireReset: true,
    target: pageRef,
  })
  // Scoped to the page so Escape in a portalled popup closes only the popup; an open autocomplete closes itself first, so the event passes through.
  useShortcut(
    'stepBack',
    () => {
      const focused = document.activeElement
      if (focused?.getAttribute('aria-expanded') === 'true') {
        return
      }
      if (focused === pageRef.current) {
        back()
      } else {
        pageRef.current?.focus()
      }
    },
    { preventDefault: false, stopPropagation: false, target: pageRef }
  )

  return (
    <div
      ref={pageRef}
      tabIndex={-1}
      className="relative flex h-full min-h-0 flex-col outline-none"
    >
      <DropOverlay shown={dragging && scope !== 'credentials'} />
      <Tooltip shortcut={<ShortcutKbd shortcut="stepBack" />}>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost-row"
              size="icon-sm"
              aria-label="Back"
              className="absolute top-4 left-4 z-20"
              onClick={back}
            />
          }
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
        </TooltipTrigger>
        <TooltipContent side="right">Back</TooltipContent>
      </Tooltip>
      <ScrollArea className="min-h-0 flex-1">
        <Form ref={formRef} form={form} className="flex min-h-full flex-col">
          {stage === 'form' ? (
            <motion.div
              key="form"
              className="py-16"
              variants={{ animate: { transition: { staggerChildren: 0.04 } } }}
              initial="initial"
              animate="animate"
            >
              <PageColumns
                aside={
                  <PasteHero
                    flash={flash}
                    mode={mode}
                    onClipboard={readClipboard}
                    onAgent={() => {
                      posthog.capture('connection_agent_opened')
                      setStage('agent')
                      pageRef.current?.focus()
                    }}
                  />
                }
              >
                <Reveal>
                  <ServerFields form={form} locked={locked} />
                  {filled && <PasteNotes fixes={filled.fixes} form={form} />}
                </Reveal>
                <Reveal>
                  <SshFields form={form} locked={locked} />
                </Reveal>
                {scope === 'all' && (
                  <Reveal>
                    <FieldGroup variant="card">
                      <NameField form={form} />
                      <LabelField form={form} />
                      <ColorField form={form} />
                      {mode.kind === 'create' && <SyncField form={form} />}
                    </FieldGroup>
                  </Reveal>
                )}
                {testStatus === 'error' && testError && (
                  <TestAlert
                    key={testError.message}
                    error={testError}
                    parts={partsOf(values)}
                    onAnswer={keepFocusInPage}
                    onFix={applyFix}
                    onFocus={(field) => {
                      posthog.capture('connection_fix_focused', { field })
                      focusField(field)
                    }}
                  />
                )}
              </PageColumns>
            </motion.div>
          ) : (
            <motion.div
              key="agent"
              className="mx-auto my-auto w-full max-w-xl px-6 py-16"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            >
              <AgentPanel />
            </motion.div>
          )}
        </Form>
      </ScrollArea>
      {stage === 'form' && (
        <FormFooter
          canTest={canSend}
          editing={mode.kind === 'edit'}
          reason={reason}
          submitting={submitting}
          testStatus={testStatus}
          onSave={submit}
          onTest={() => runTest(values)}
        />
      )}
    </div>
  )
}
