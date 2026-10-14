import type { ConnectionParts } from '@tamery/connection/connection-parts'
import { toConnectionParts } from '@tamery/connection/connection-parts'
import type { ConnectionPatch } from '@tamery/connection/diagnose'
import type { ConnectionGuess } from '@tamery/connection/guess'
import { guessConnection } from '@tamery/connection/guess'
import { isLocalHost } from '@tamery/connection/hosts'
import type { SshTunnel } from '@tamery/connection/ssh/params'
import { EMPTY_SSH_TUNNEL } from '@tamery/connection/ssh/params'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { SyncType } from '@tamery/shared/enums/sync-type'
import { pick } from '@tamery/shared/utils'
import { useAppForm } from '@tamery/ui/components/tanstack-form'
import { type } from 'arktype'

import type { Connection } from '~/core/connection/sync'
import { posthog } from '~/lib/posthog'

import type { PasteVia } from './use-paste-connection'

export interface ConnectionFormValues extends Omit<
  ConnectionParts,
  'ssh' | 'type'
> {
  color: string | null
  label: string
  name: string
  ssh: SshTunnel
  sshEnabled: boolean
  syncType: SyncType
  type: ConnectionType
}

const DEFAULT_VALUES: ConnectionFormValues = {
  color: null,
  database: '',
  host: '',
  https: null,
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

export const formValuesOf = (
  connection: Connection,
  connectionString: string | null
): ConnectionFormValues => {
  const parts = connectionString ? toConnectionParts(connectionString) : null
  return {
    ...DEFAULT_VALUES,
    ...(parts && pick(parts, [...SERVER_FIELDS, 'https'])),
    color: connection.color,
    label: connection.label ?? '',
    name: connection.name,
    ssh: parts?.ssh ?? EMPTY_SSH_TUNNEL,
    sshEnabled: !!parts?.ssh,
    syncType: connection.syncType,
    type: connection.type,
  }
}

export const partsOf = (values: ConnectionFormValues): ConnectionParts => ({
  ...pick(values, [...SERVER_FIELDS, 'https', 'type']),
  ssh: values.sshEnabled ? values.ssh : null,
})

const BARE_HOST = /^[\w.-]+$/u
const NEEDED_FIELDS = ['host', 'user', 'password'] as const

/** A local server often runs without a password (trust auth), so its empty one isn't missing. */
export const missingOf = (values: ConnectionFormValues) =>
  NEEDED_FIELDS.filter(
    (field) =>
      !values[field].trim() &&
      !(field === 'password' && isLocalHost(values.host.trim()))
  )

/** Credentials typed around a partial paste must survive it; only a paste naming another server clears every server field. */
const fill = (form: ConnectionForm, { parts }: ConnectionGuess) => {
  const { host } = form.state.values
  const newServer = !!parts.host && BARE_HOST.test(host) && parts.host !== host
  for (const field of SERVER_FIELDS) {
    if (newServer || parts[field]) {
      form.setFieldValue(field, parts[field] ?? '')
    }
  }
  if (parts.type) {
    form.setFieldValue('type', parts.type)
  }
  if (parts.https !== undefined || newServer) {
    form.setFieldValue('https', parts.https ?? null)
  }
  if (parts.ssh || newServer) {
    form.setFieldValue('ssh', parts.ssh ?? EMPTY_SSH_TUNNEL)
    form.setFieldValue('sshEnabled', !!parts.ssh)
  }
}

const expandHost = (
  form: ConnectionForm,
  onFill: (guess: ConnectionGuess, pasted: boolean) => void
) => {
  const { host } = form.state.values
  const guess = guessConnection(host)
  if (guess && (guess.format !== 'host' || guess.parts.host !== host)) {
    fill(form, guess)
    onFill(guess, false)
  }
}

export const useConnectionForm = ({
  defaultValues = DEFAULT_VALUES,
  onFill,
  onSubmit,
}: {
  defaultValues?: ConnectionFormValues
  onFill: (guess: ConnectionGuess, pasted: boolean) => void
  onSubmit: () => Promise<void>
}) => {
  const form = useAppForm({
    defaultValues,
    listeners: {
      onBlur: ({ fieldApi }) => {
        if (fieldApi.name === 'host') {
          expandHost(form, onFill)
        }
      },
    },
    onSubmit: () => {
      expandHost(form, onFill)
      return onSubmit()
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
      fill(form, guess)
      onFill(guess, true)
    },
    patch: (patch: ConnectionPatch) => {
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
      }
    },
  }
}

export type ConnectionForm = ReturnType<typeof useConnectionForm>['form']
