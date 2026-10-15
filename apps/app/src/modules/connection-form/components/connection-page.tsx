import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import type { ConnectionPatch } from '@tamery/connection/diagnose'
import type { GuessFix, GuessFormat } from '@tamery/connection/guess'
import { IconButton } from '@tamery/ui/components/custom/icon-button'
import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import { FieldGroup } from '@tamery/ui/components/field'
import { Form } from '@tamery/ui/components/tanstack-form'
import { useSelector } from '@tanstack/react-form'
import type { Variants } from 'motion/react'
import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

import { ShortcutKbd } from '~/core/keyboard/shortcut-kbd'
import { useShortcut } from '~/core/keyboard/use-shortcuts'
import { useGoBack } from '~/hooks/use-go-back'
import { posthog } from '~/lib/posthog'

import type { ConnectionFormValues } from '../lib/connection-form'
import { missingOf, partsOf, useConnectionForm } from '../lib/connection-form'
import type { FormMode } from '../lib/form-mode'
import { formPolicyOf } from '../lib/form-mode'
import { usePasteConnection } from '../lib/use-paste-connection'
import { usePickLocalDatabase } from '../lib/use-pick-local-database'
import type { OnSave } from '../lib/use-test-then-save'
import { useTestThenSave } from '../lib/use-test-then-save'
import { AgentPanel } from './agent-panel'
import { ColorField } from './color-field'
import { DropOverlay } from './drop-overlay'
import { FormFooter } from './form-footer'
import { LabelField } from './label-field'
import { NameField } from './name-field'
import { PageColumns } from './page-columns'
import { PasteHero } from './paste-hero'
import { PasteNotes } from './paste-notes'
import { ServerFields } from './server-fields'
import { SshFields } from './ssh-fields'
import { SyncField } from './sync-field'
import type { FixSource } from './test-alert'
import { TestAlert } from './test-alert'
import { UnsavedChangesGuard } from './unsaved-changes-guard'

const REVEAL: Variants = {
  animate: {
    opacity: 1,
    transition: { duration: 0.25, ease: [0.32, 0.72, 0, 1] },
    y: 0,
  },
  initial: { opacity: 0, y: 8 },
}

// Field ids hold dots (`ssh.host`), which a bare `#id` selector reads as a class.
const focusField = (id: string) =>
  document.querySelector<HTMLElement>(`#${CSS.escape(id)}`)?.focus()

export const ConnectionPage = ({
  defaultValues,
  mode,
  onSave,
}: {
  defaultValues?: ConnectionFormValues
  mode: FormMode
  onSave: OnSave
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
  // A button that disappears once pressed (a fix, Ask AI) hands focus to the page first: on body the page's keys no longer reach.
  const focusPage = () => pageRef.current?.focus()
  const { draftOf, runTest, save, testError } = useTestThenSave(mode, onSave)
  const policy = formPolicyOf(mode)

  const { form, paste, patch } = useConnectionForm({
    defaultValues,
    onFill: ({ fixes, format }, pasted) => {
      setFilled((current) => ({
        fixes,
        origin: pasted ? format : current?.origin,
      }))
    },
    onSubmit: () => save(form, filled?.origin),
    unfilledSecrets: policy.unfilledSecrets,
  })
  // Through the form element, not `form.handleSubmit()`: the kit Form's submit handler then focuses the first invalid field.
  const submit = () => formRef.current?.requestSubmit()

  // Declared before usePasteConnection: a connection link's paste then focuses its first missing field after this.
  useEffect(() => {
    if (policy.firstField) {
      focusField(policy.firstField)
    } else {
      pageRef.current?.focus()
    }
  }, [policy.firstField])

  const { dragging, flash, read, readClipboard } = usePasteConnection({
    enabled: policy.pasteable,
    onPaste: (guess, via) => {
      paste(guess, via)
      // The agent panel holds no fields: render the form before focusing one.
      if (stage === 'agent') {
        flushSync(() => setStage('form'))
      }
      const [missing] = missingOf(form.state.values)
      if (missing) {
        focusField(missing)
      }
    },
    pitchShown: stage === 'form',
  })

  const { passwordWithheldBy, pick: pickLocalDatabase } = usePickLocalDatabase({
    form,
    read,
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
    if (fix.sshEnabled) {
      flushSync(() => patch(fix))
      focusField('ssh.host')
      return
    }
    patch(fix)
    focusPage()
    void runTest(form.state.values)
  }

  // Bound on the page, which sits inside React's root: the listener runs before a focused control's own keydown (the SSH switch toggles on Enter) and stops it.
  // TanStack Form runs `onSubmit` again while one is in flight, so ⌘↩ is off during a save, like the disabled Save button.
  useShortcut('submit', submit, {
    enabled: stage === 'form' && !submitting,
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
      <DropOverlay shown={dragging} />
      {policy.guardsUnsaved && (
        <UnsavedChangesGuard isDirty={() => !form.state.isDefaultValue} />
      )}
      <IconButton
        type="button"
        variant="ghost-faint"
        size="icon-sm"
        icon={ArrowLeft01Icon}
        label="Back"
        shortcut={<ShortcutKbd shortcut="stepBack" />}
        side="right"
        className="absolute top-4 left-4 z-20"
        onClick={back}
      />
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
                    pasteable={policy.pasteable}
                    onClipboard={readClipboard}
                    onLocalDatabase={pickLocalDatabase}
                    onAgent={() => {
                      posthog.capture('connection_agent_opened')
                      setStage('agent')
                      pageRef.current?.focus()
                    }}
                  />
                }
              >
                <motion.div className="flex flex-col gap-5" variants={REVEAL}>
                  <ServerFields form={form} locked={policy.locked} />
                  {filled && (
                    <PasteNotes
                      fixes={filled.fixes}
                      form={form}
                      passwordWithheldBy={passwordWithheldBy}
                    />
                  )}
                </motion.div>
                <motion.div className="flex flex-col gap-5" variants={REVEAL}>
                  <SshFields form={form} locked={policy.locked} />
                </motion.div>
                {policy.showsMeta && (
                  <motion.div variants={REVEAL}>
                    <FieldGroup variant="card">
                      <NameField form={form} />
                      <LabelField form={form} />
                      <ColorField form={form} />
                      {mode.kind === 'create' && <SyncField form={form} />}
                    </FieldGroup>
                  </motion.div>
                )}
                {testStatus === 'error' && testError && (
                  <TestAlert
                    key={testError.message}
                    error={testError}
                    parts={partsOf(values)}
                    onAsk={focusPage}
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
              variants={REVEAL}
              initial="initial"
              animate="animate"
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
          reason={values.host.trim() ? reason : null}
          submitting={submitting}
          testStatus={testStatus}
          onSave={submit}
          onTest={() => runTest(values)}
        />
      )}
    </div>
  )
}
