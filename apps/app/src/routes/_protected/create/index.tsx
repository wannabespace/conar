import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { toConnectionString } from '@tamery/connection/connection-parts'
import type { ConnectionPatch } from '@tamery/connection/diagnose'
import type { GuessFix } from '@tamery/connection/guess'
import { suggestConnectionName } from '@tamery/connection/guess/name'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { title } from '@tamery/shared/title'
import { Button } from '@tamery/ui/components/button'
import { MotionCollapse } from '@tamery/ui/components/collapse.motion'
import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import { FieldGroup } from '@tamery/ui/components/field'
import { Kbd } from '@tamery/ui/components/kbd'
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
import { useState } from 'react'
import { toast } from 'sonner'

import { testConnectionQuery } from '~/core/queries/connection/test'
import { useLocalProxyAvailable } from '~/core/runtime/proxy'
import { permix } from '~/core/user/permissions'
import { posthog } from '~/lib/posthog'
import { generateRandomName } from '~/utils/faker'

import { ColorField } from './-components/color-field'
import { ConnectionHeader } from './-components/connection-header'
import { DropOverlay } from './-components/drop-overlay'
import { FormFooter } from './-components/form-footer'
import { LabelField } from './-components/label-field'
import { Reveal, REVEAL_STAGGER } from './-components/reveal'
import { ServerFields } from './-components/server-fields'
import { SshFields } from './-components/ssh-fields'
import { SyncField } from './-components/sync-field'
import type { FixSource } from './-components/test-alert'
import { TestAlert } from './-components/test-alert'
import type { ConnectionFormValues, FieldsOrigin } from './-lib/connection-form'
import { missingOf, partsOf, useConnectionForm } from './-lib/connection-form'
import { draftFetching } from './-lib/draft-fetching'
import { useCreateConnection } from './-lib/use-create-connection'
import { usePasteConnection } from './-lib/use-paste-connection'

const FORM_ID = 'create-connection'

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
  const [origin, setOrigin] = useState<FieldsOrigin>('form')
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
  const { dragging } = usePasteConnection({
    onMiss: () => toast('No connection in that'),
    onPaste: (guess, via) => {
      paste(guess, via)
      setFixes(guess.fixes)
      const [missing] = missingOf(form.state.values)
      if (missing) {
        document.querySelector<HTMLElement>(`#${missing}`)?.focus()
      }
    },
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
      // Waits for the SSH card to mount.
      setTimeout(
        () => document.querySelector<HTMLElement>('#ssh\\.host')?.focus(),
        0
      )
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
      leave()
    },
    { ignoreInputs: false }
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DropOverlay shown={dragging} />
      <ScrollArea className="min-h-0 flex-1">
        <Form form={form} id={FORM_ID} className="relative">
          <Tooltip shortcut={<Kbd>Esc</Kbd>}>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost-row"
                  size="icon-sm"
                  aria-label="Back"
                  className="absolute top-4 left-4"
                  onClick={leave}
                />
              }
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
            </TooltipTrigger>
            <TooltipContent side="right">Back</TooltipContent>
          </Tooltip>
          <motion.div
            className="mx-auto flex w-full max-w-xl flex-col gap-5 px-6 py-16"
            variants={REVEAL_STAGGER}
            initial="initial"
            animate="animate"
          >
            <Reveal>
              <ConnectionHeader
                filled={origin !== 'form'}
                fixes={fixes}
                form={form}
              />
            </Reveal>
            <Reveal>
              <ServerFields form={form} />
            </Reveal>
            <Reveal>
              <SshFields form={form} />
            </Reveal>
            <Reveal>
              <FieldGroup variant="card">
                <LabelField form={form} />
                <ColorField form={form} />
              </FieldGroup>
              <SyncField form={form} />
            </Reveal>
          </motion.div>
        </Form>
      </ScrollArea>
      <AnimatePresence initial={false}>
        {test.error && (
          <MotionCollapse key="test-error">
            <div className="mx-auto max-h-80 w-full max-w-xl overflow-y-auto px-6 pb-3">
              <TestAlert
                key={test.error.message}
                error={test.error}
                parts={partsOf(values)}
                onFix={applyFix}
                onFocus={(field) =>
                  document.querySelector<HTMLElement>(`#${field}`)?.focus()
                }
              />
            </div>
          </MotionCollapse>
        )}
      </AnimatePresence>
      <FormFooter
        canTest={canSend}
        formId={FORM_ID}
        reason={reason}
        saving={createConnection.isPending}
        testStatus={test.status}
        onTest={() => test.mutate({ connectionString, type: values.type })}
      />
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
