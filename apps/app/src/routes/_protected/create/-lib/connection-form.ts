import type { ConnectionParts } from '@tamery/connection/connection-parts'
import type { ConnectionGuess, GuessFormat } from '@tamery/connection/guess'
import { guessConnection } from '@tamery/connection/guess'
import type { SshTunnel } from '@tamery/connection/ssh/params'
import { EMPTY_SSH_TUNNEL } from '@tamery/connection/ssh/params'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { SyncType } from '@tamery/shared/enums/sync-type'
import { useAppForm } from '@tamery/ui/components/tanstack-form'
import { type } from 'arktype'

import { posthog } from '~/lib/posthog'

import type { PasteVia } from './use-paste-connection'

export interface ConnectionFormValues {
  color: string | null
  database: string
  host: string
  label: string
  name: string
  options: string
  password: string
  port: string
  ssh: SshTunnel
  sshEnabled: boolean
  syncType: SyncType
  type: ConnectionType
  user: string
}

/** Where the fields came from: a recognised paste, or the fields themselves. */
export type FieldsOrigin = GuessFormat | 'form' | null

export const isGuessed = (origin: FieldsOrigin): origin is GuessFormat =>
  origin !== null && origin !== 'form'

const DEFAULT_VALUES: ConnectionFormValues = {
  color: null,
  database: '',
  host: '',
  label: '',
  name: '',
  options: '',
  password: '',
  port: '',
  ssh: EMPTY_SSH_TUNNEL,
  sshEnabled: false,
  syncType: SyncType.Cloud,
  type: ConnectionType.Postgres,
  user: '',
}

const SERVER_FIELDS = [
  'database',
  'host',
  'options',
  'password',
  'port',
  'user',
] as const

const port = type(/^\d{0,5}$/u).configure({ message: 'Use a port number' })

const connectionFormSchema = type({
  host: type(/\S/u).configure({ message: 'Enter the host' }),
  port,
  ssh: { host: 'string', port },
  sshEnabled: 'boolean',
}).narrow(
  (values, ctx) =>
    !values.sshEnabled ||
    /\S/u.test(values.ssh.host) ||
    ctx.reject({ message: 'Enter the SSH host', path: ['ssh', 'host'] })
)

/** Not `dontUpdateMeta`: only a meta update clears the field's `onMount` error, which would otherwise mark a filled field as empty. */
const QUIET = { dontRunListeners: true }

export const partsOf = (values: ConnectionFormValues): ConnectionParts => ({
  database: values.database,
  host: values.host,
  options: values.options,
  password: values.password,
  port: values.port,
  ssh: values.sshEnabled ? values.ssh : null,
  type: values.type,
  user: values.user,
})

const isPartField = (name: string) =>
  name === 'type' ||
  name === 'sshEnabled' ||
  name.startsWith('ssh.') ||
  SERVER_FIELDS.some((field) => field === name)

const BARE_HOST = /^[\w.-]+$/u
const NEEDED_FIELDS = ['host', 'user', 'password'] as const

/** The fields a paste usually leaves out (DBeaver copies a URL without credentials), in form order. */
export const missingOf = (values: ConnectionFormValues) =>
  NEEDED_FIELDS.filter((field) => !values[field].trim())

/** A paste fills what it names and keeps the rest, so credentials typed around a partial paste survive; one naming another server than the filled host replaces every server field instead. */
const fill = (
  form: ConnectionForm,
  { format, parts }: ConnectionGuess,
  onFieldsChange: (origin: FieldsOrigin) => void
) => {
  const { host } = form.state.values
  const newServer = !!parts.host && BARE_HOST.test(host) && parts.host !== host
  for (const field of SERVER_FIELDS) {
    if (newServer || parts[field]) {
      form.setFieldValue(field, parts[field] ?? '', QUIET)
    }
  }
  if (parts.type) {
    form.setFieldValue('type', parts.type, QUIET)
  }
  if (parts.ssh || newServer) {
    form.setFieldValue('ssh', parts.ssh ?? EMPTY_SSH_TUNNEL, QUIET)
    form.setFieldValue('sshEnabled', !!parts.ssh, QUIET)
  }
  onFieldsChange(format)
}

const expandHost = (
  form: ConnectionForm,
  onFieldsChange: (origin: FieldsOrigin) => void
) => {
  const { host } = form.state.values
  const guess = guessConnection(host)
  if (guess && (guess.format !== 'host' || guess.parts.host !== host)) {
    fill(form, guess, onFieldsChange)
  }
}

export const useConnectionForm = ({
  onFieldsChange,
  onInvalid,
  onSubmit,
}: {
  onFieldsChange: (origin: FieldsOrigin) => void
  onInvalid: (field: string) => void
  onSubmit: (values: ConnectionFormValues) => void
}) => {
  const form = useAppForm({
    defaultValues: DEFAULT_VALUES,
    listeners: {
      onBlur: ({ fieldApi }) => {
        if (fieldApi.name === 'host') {
          expandHost(form, onFieldsChange)
        }
      },
      onChange: ({ fieldApi }) => {
        if (isPartField(fieldApi.name)) {
          onFieldsChange('form')
        }
      },
    },
    onSubmitInvalid: ({ formApi }) => {
      const [field] =
        Object.entries(formApi.state.fieldMeta).find(
          ([, meta]) => meta?.errors.length
        ) ?? []
      if (field) {
        onInvalid(field)
      }
    },
    onSubmit: () => {
      expandHost(form, onFieldsChange)
      onSubmit(form.state.values)
    },
    validators: {
      onChange: connectionFormSchema,
      onMount: connectionFormSchema,
    },
  })

  return {
    form,
    paste: (guess: ConnectionGuess, via: PasteVia) => {
      posthog.capture('connection_pasted', { format: guess.format, via })
      fill(form, guess, onFieldsChange)
    },
  }
}

export type ConnectionForm = ReturnType<typeof useConnectionForm>['form']
