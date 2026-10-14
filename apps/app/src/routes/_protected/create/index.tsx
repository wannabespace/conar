import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { ConnectionPatch } from '@tamery/connection/diagnose'
import type {
  ConnectionGuess,
  GuessFix,
  GuessFormat,
} from '@tamery/connection/guess'
import { title } from '@tamery/shared/title'
import { Button } from '@tamery/ui/components/button'
import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import { FieldGroup } from '@tamery/ui/components/field'
import { Form } from '@tamery/ui/components/tanstack-form'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useStore } from '@tanstack/react-form'
import {
  createFileRoute,
  redirect,
  useCanGoBack,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import { ShortcutKbd } from '~/core/keyboard/shortcut-kbd'
import { useShortcut } from '~/core/keyboard/use-shortcuts'
import { useLocalProxyAvailable } from '~/core/runtime/proxy'
import { permix } from '~/core/user/permissions'
import { posthog } from '~/lib/posthog'

import { AgentPanel } from './-components/agent-panel'
import { ColorField } from './-components/color-field'
import { DropOverlay } from './-components/drop-overlay'
import { FormFooter } from './-components/form-footer'
import { LabelField } from './-components/label-field'
import { NameField } from './-components/name-field'
import { PageColumns } from './-components/page-columns'
import { PasteHero } from './-components/paste-hero'
import { PasteNotes } from './-components/paste-notes'
import { Reveal, REVEAL_STAGGER } from './-components/reveal'
import { ServerFields } from './-components/server-fields'
import { SshFields } from './-components/ssh-fields'
import { SyncField } from './-components/sync-field'
import type { FixSource } from './-components/test-alert'
import { TestAlert } from './-components/test-alert'
import { missingOf, partsOf, useConnectionForm } from './-lib/connection-form'
import { draftFetching } from './-lib/draft-fetching'
import type { PasteVia } from './-lib/use-paste-connection'
import { usePasteConnection } from './-lib/use-paste-connection'
import { useSaveConnection } from './-lib/use-save-connection'

type Stage = 'agent' | 'form'

// Defers to the next tick so a field the same update reveals has mounted.
const focusField = (id: string) =>
  setTimeout(
    () => document.querySelector<HTMLElement>(`#${CSS.escape(id)}`)?.focus(),
    0
  )

const CreateConnectionPage = () => {
  const router = useRouter()
  const navigate = useNavigate()
  const canGoBack = useCanGoBack()
  const leave = () => {
    if (canGoBack) {
      router.history.back()
    } else {
      void navigate({ to: '/' })
    }
  }
  const isLocalProxyAvailable = useLocalProxyAvailable()
  const [filled, setFilled] = useState<{
    fixes: GuessFix[]
    origin?: GuessFormat
  }>()
  const [stage, setStage] = useState<Stage>('form')
  const pageRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const back = () => (stage === 'agent' ? setStage('form') : leave())
  // A focused control that unmounts (a fix button, Ask AI) drops focus to body, where the page's keys no longer reach.
  const keepFocusInPage = () =>
    setTimeout(() => {
      if (document.activeElement === document.body) {
        pageRef.current?.focus()
      }
    }, 0)
  const { save, test } = useSaveConnection()

  const { form, paste, patch } = useConnectionForm({
    onFill: ({ fixes, format }, pasted) => {
      setFilled((current) => ({
        fixes,
        origin: pasted ? format : current?.origin,
      }))
      test.reset()
    },
    onPartsChange: () => test.reset(),
    onSubmit: () => save(() => form.state.values, filled?.origin),
  })
  // From the second attempt TanStack Form runs `onSubmit` even while one is in flight, so a press during a save is dropped here.
  const submit = () => {
    if (!form.state.isSubmitting) {
      formRef.current?.requestSubmit()
    }
  }

  const fillFrom = (guess: ConnectionGuess, via: PasteVia) => {
    paste(guess, via)
    setStage('form')
    const [missing] = missingOf(form.state.values)
    if (missing) {
      focusField(missing)
    }
  }
  const { dragging, miss, readClipboard } = usePasteConnection({
    onPaste: fillFrom,
    pitchShown: stage === 'form',
  })

  const values = useStore(form.store, (state) => state.values)
  const submitting = useStore(form.store, (state) => state.isSubmitting)
  const { canSend, connectionString, reason } = draftFetching(
    values,
    isLocalProxyAvailable
  )

  const applyFix = (fix: ConnectionPatch, source: FixSource) => {
    posthog.capture('connection_fix_applied', {
      fields: Object.entries(fix)
        .flatMap(([field, value]) => (value === undefined ? [] : [field]))
        .toSorted()
        .join(','),
      source,
    })
    patch(fix)
    test.reset()
    if (fix.sshEnabled) {
      focusField('ssh.host')
      return
    }
    keepFocusInPage()
    const next = form.state.values
    const draft = draftFetching(next, isLocalProxyAvailable)
    if (draft.canSend) {
      test.mutate({ connectionString: draft.connectionString, type: next.type })
    }
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
      <DropOverlay shown={dragging} />
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
              variants={REVEAL_STAGGER}
              initial="initial"
              animate="animate"
            >
              <PageColumns
                aside={
                  <PasteHero
                    miss={miss}
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
                  <ServerFields form={form} />
                  {filled && <PasteNotes fixes={filled.fixes} form={form} />}
                </Reveal>
                <Reveal>
                  <SshFields form={form} />
                </Reveal>
                <Reveal>
                  <FieldGroup variant="card">
                    <NameField form={form} />
                    <LabelField form={form} />
                    <ColorField form={form} />
                    <SyncField form={form} />
                  </FieldGroup>
                </Reveal>
                {test.error && (
                  <TestAlert
                    key={test.error.message}
                    error={test.error}
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
          reason={reason}
          submitting={submitting}
          testStatus={test.status}
          onSave={submit}
          onTest={() => test.mutate({ connectionString, type: values.type })}
        />
      )}
    </div>
  )
}

export const Route = createFileRoute('/_protected/create/')({
  beforeLoad: ({ context: { collections } }) => {
    if (
      !permix.check('connection.create', {
        count: collections.connectionsCollection.size,
      })
    ) {
      throw redirect({ to: '/' })
    }
  },
  component: CreateConnectionPage,
  head: () => ({
    meta: [{ title: title('New connection') }],
  }),
})
