import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { toConnectionString } from '@tamery/connection/connection-parts'
import type { ConnectionPatch } from '@tamery/connection/diagnose'
import type { ConnectionGuess, GuessFix } from '@tamery/connection/guess'
import { guessConnection } from '@tamery/connection/guess'
import { suggestConnectionName } from '@tamery/connection/guess/name'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { title } from '@tamery/shared/title'
import { tryCatchAsync } from '@tamery/shared/utils'
import { Button } from '@tamery/ui/components/button'
import { MotionCollapse } from '@tamery/ui/components/collapse.motion'
import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import { FieldGroup } from '@tamery/ui/components/field'
import { Form } from '@tamery/ui/components/tanstack-form'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useStore } from '@tanstack/react-form'
import { useHotkey } from '@tanstack/react-hotkeys'
import { useMutation } from '@tanstack/react-query'
import {
  createFileRoute,
  redirect,
  useCanGoBack,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { ShortcutKbd } from '~/core/keyboard/shortcut-kbd'
import { testConnectionQuery } from '~/core/queries/connection/test'
import { useLocalProxyAvailable } from '~/core/runtime/proxy'
import { permix } from '~/core/user/permissions'
import { posthog } from '~/lib/posthog'
import { generateRandomName } from '~/utils/faker'

import { AgentPanel } from './-components/agent-panel'
import { ColorField } from './-components/color-field'
import { DropOverlay } from './-components/drop-overlay'
import { FormFooter } from './-components/form-footer'
import { LabelField } from './-components/label-field'
import { NameField } from './-components/name-field'
import { PageColumns } from './-components/page-columns'
import type { Miss } from './-components/paste-hero'
import { isMac, PASTE_FORMATS, PasteHero } from './-components/paste-hero'
import { PasteNotes } from './-components/paste-notes'
import { Reveal, REVEAL_STAGGER } from './-components/reveal'
import { ServerFields } from './-components/server-fields'
import { SshFields } from './-components/ssh-fields'
import { SyncField } from './-components/sync-field'
import type { FixSource } from './-components/test-alert'
import { TestAlert } from './-components/test-alert'
import type { ConnectionFormValues, FieldsOrigin } from './-lib/connection-form'
import {
  isGuessed,
  missingOf,
  partsOf,
  useConnectionForm,
} from './-lib/connection-form'
import { draftFetching } from './-lib/draft-fetching'
import { useCreateConnection } from './-lib/use-create-connection'
import type { PasteVia } from './-lib/use-paste-connection'
import { usePasteConnection } from './-lib/use-paste-connection'

const FORM_ID = 'create-connection'

type Stage = 'agent' | 'form'

const MISS_SHOWN_MS = 3000

// Defers to the next tick so a field the same update reveals has mounted.
const focusField = (id: string) =>
  setTimeout(() => document.querySelector<HTMLElement>(`#${id}`)?.focus(), 0)

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
  const [origin, setOrigin] = useState<FieldsOrigin>(null)
  const [stage, setStage] = useState<Stage>('form')
  const back = () => (stage === 'agent' ? setStage('form') : leave())
  const createConnection = useCreateConnection()
  const test = useMutation({
    meta: { event: 'connection_tested' },
    mutationFn: (params: { connectionString: string; type: ConnectionType }) =>
      testConnectionQuery.run(params),
  })

  const save = (values: ConnectionFormValues) =>
    createConnection.mutate({
      color: values.color,
      connectionString: toConnectionString(partsOf(values)),
      label: values.label.trim() || null,
      name:
        values.name.trim() ||
        suggestConnectionName(values) ||
        generateRandomName(),
      origin,
      syncType: values.syncType,
      type: values.type,
    })

  const { form, paste } = useConnectionForm({
    onInvalid: (field) => {
      focusField(CSS.escape(field))
    },
    onFieldsChange: (next) => {
      setOrigin(next)
      test.reset()
    },
    onSubmit: (values) => {
      if (test.isPending) {
        return
      }
      const draft = draftFetching(values, isLocalProxyAvailable)
      if (!draft.canSend || test.status !== 'idle') {
        save(values)
        return
      }
      test.mutate(
        { connectionString: draft.connectionString, type: values.type },
        { onSuccess: () => save(values) }
      )
    },
  })

  const [fixes, setFixes] = useState<GuessFix[]>([])
  const fillFrom = (guess: ConnectionGuess, via: PasteVia) => {
    paste(guess, via)
    setStage('form')
    setFixes(guess.fixes)
    const [missing] = missingOf(form.state.values)
    if (missing) {
      focusField(missing)
    }
  }
  const [miss, setMiss] = useState<Miss>({ count: 0, shown: false })
  const hideMiss = useRef(0)
  const showMiss = () => {
    if (stage !== 'form') {
      toast('No connection found', {
        description: PASTE_FORMATS,
      })
      return
    }
    setMiss(({ count }) => ({ count: count + 1, shown: true }))
    window.clearTimeout(hideMiss.current)
    hideMiss.current = window.setTimeout(
      () => setMiss((current) => ({ ...current, shown: false })),
      MISS_SHOWN_MS
    )
  }
  const readClipboard = async () => {
    const { data: text } = await tryCatchAsync(() =>
      navigator.clipboard.readText()
    )
    if (text === null) {
      toast(
        `Couldn't read the clipboard. Press ${isMac ? '⌘V' : 'Ctrl+V'} instead.`
      )
      return
    }
    const guess = guessConnection(text)
    if (guess) {
      fillFrom(guess, 'clipboard')
    } else {
      showMiss()
    }
  }
  const { dragging } = usePasteConnection({
    onMiss: showMiss,
    onPaste: fillFrom,
  })

  const values = useStore(form.store, (state) => state.values)
  const { canSend, connectionString, reason } = draftFetching(
    values,
    isLocalProxyAvailable
  )

  const applyFix = (patch: ConnectionPatch, source: FixSource) => {
    posthog.capture('connection_fix_applied', {
      fields: Object.keys(patch).toSorted().join(','),
      source,
    })
    for (const field of ['database', 'host', 'options', 'port'] as const) {
      const value = patch[field]
      if (value !== undefined) {
        form.setFieldValue(field, value)
      }
    }
    if (patch.type) {
      form.setFieldValue('type', patch.type)
    }
    if (patch.sshEnabled) {
      form.setFieldValue('sshEnabled', true)
      focusField(String.raw`ssh\.host`)
      return
    }
    const next = form.state.values
    const draft = draftFetching(next, isLocalProxyAvailable)
    test.reset()
    if (draft.canSend) {
      test.mutate({ connectionString: draft.connectionString, type: next.type })
    }
  }

  useHotkey(
    'Mod+Enter',
    (event) => {
      event.preventDefault()
      void form.handleSubmit()
    },
    { ignoreInputs: false }
  )
  useHotkey(
    'Escape',
    () => {
      const focused = document.activeElement
      if (focused instanceof HTMLElement && focused !== document.body) {
        focused.blur()
        return
      }
      back()
    },
    { ignoreInputs: false }
  )

  return (
    <div className="relative flex h-full min-h-0 flex-col">
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
        <Form form={form} id={FORM_ID} className="flex min-h-full flex-col">
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
                    }}
                  />
                }
              >
                <Reveal>
                  <ServerFields form={form} />
                  {isGuessed(origin) && (
                    <PasteNotes fixes={fixes} form={form} />
                  )}
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
      <AnimatePresence initial={false}>
        {test.error && (
          <MotionCollapse key="test-error">
            <PageColumns className="max-h-80 overflow-y-auto pb-3">
              <TestAlert
                key={test.error.message}
                error={test.error}
                parts={partsOf(values)}
                onFix={applyFix}
                onFocus={(field) =>
                  document.querySelector<HTMLElement>(`#${field}`)?.focus()
                }
              />
            </PageColumns>
          </MotionCollapse>
        )}
      </AnimatePresence>
      {stage === 'form' && (
        <FormFooter
          canTest={canSend}
          formId={FORM_ID}
          reason={reason}
          saving={createConnection.isPending}
          testStatus={test.status}
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
