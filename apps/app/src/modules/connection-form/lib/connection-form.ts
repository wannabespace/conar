import type { ConnectionParts } from '@tamery/connection/connection-parts'
import { connectionParts } from '@tamery/connection/connection-parts'
import type { ConnectionPatch } from '@tamery/connection/diagnosis'
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
import { useState } from 'react'

import type { Connection } from '~/core/connection/sync'
import { posthog } from '~/lib/posthog'
import { generateRandomName } from '~/utils/faker'

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

export const opensFile = (connectionType: ConnectionType) =>
  connectionType === ConnectionType.SQLite

/** The field that names where the database is: SQLite's file, every other engine's host. */
export const getPlaceField = (connectionType: ConnectionType) =>
  opensFile(connectionType) ? 'database' : 'host'

const PLACE_MESSAGES = {
  database: 'Choose the database file',
  host: 'Enter the host',
}

const FULL_PATH = /^\s*(?:\/|~\/|[a-z]:[\\/])/iu

const connectionFormSchema = type({
  database: 'string',
  host: 'string',
  port,
  ssh: { host: 'string', port },
  sshEnabled: 'boolean',
  type: type.valueOf(ConnectionType),
})
  .narrow((values, ctx) => {
    const field = getPlaceField(values.type)
    return (
      /\S/u.test(values[field]) ||
      ctx.reject({ message: PLACE_MESSAGES[field], path: [field] })
    )
  })
  .narrow(
    (values, ctx) =>
      !opensFile(values.type) ||
      !/\S/u.test(values.database) ||
      FULL_PATH.test(values.database) ||
      ctx.reject({
        message: "Use the file's full path, like /Users/me/app.db",
        path: ['database'],
      })
  )
  .narrow(
    (values, ctx) =>
      !values.sshEnabled ||
      /\S/u.test(values.ssh.host) ||
      ctx.reject({ message: 'Enter the SSH host', path: ['ssh', 'host'] })
  )

export const getFormValues = (
  connection: Connection,
  connectionString: string | null
): ConnectionFormValues => {
  const parts =
    connectionString === null ? null : connectionParts.parse(connectionString)
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

export const getParts = (values: ConnectionFormValues): ConnectionParts => ({
  ...pick(values, [...SERVER_FIELDS, 'https']),
  ssh: values.sshEnabled ? values.ssh : null,
  type: values.type,
})

const BARE_HOST = /^[\w.:%[\]-]+$/u
const NEEDED_FIELDS = ['host', 'user', 'password'] as const

export const getMissing = (values: ConnectionFormValues) =>
  opensFile(values.type)
    ? []
    : NEEDED_FIELDS.filter(
        (field) =>
          !values[field].trim() &&
          !(field === 'password' && isLocalHost(values.host.trim()))
      )

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

/** Reads a whole string typed into the field that names where the database is, as a paste would. */
const expandPlace = (
  form: ConnectionForm,
  onFill: (guess: ConnectionGuess, pasted: boolean) => void
) => {
  const { database, host, type: connectionType } = form.state.values
  if (opensFile(connectionType)) {
    const guess = guessConnection(database)
    if (
      guess?.parts.type === ConnectionType.SQLite &&
      guess.parts.database !== database
    ) {
      fill(form, guess)
      onFill(guess, false)
    }
    return
  }
  const guess = guessConnection(host)
  if (guess && (guess.format !== 'host' || guess.parts.host !== host)) {
    fill(form, guess)
    onFill(guess, false)
  }
}

export const useConnectionForm = ({
  defaultValues,
  onFill,
  onSubmit,
  unfilledSecrets,
}: {
  defaultValues?: ConnectionFormValues
  onFill: (guess: ConnectionGuess, pasted: boolean) => void
  onSubmit: () => Promise<void>
  unfilledSecrets: (values: ConnectionFormValues) => Record<string, string>
}) => {
  // oxlint-disable-next-line react/hook-use-state -- frozen at mount, never set
  const [initialValues] = useState(
    () => defaultValues ?? { ...DEFAULT_VALUES, name: generateRandomName() }
  )
  const form = useAppForm({
    defaultValues: initialValues,
    listeners: {
      onBlur: ({ fieldApi }) => {
        if (fieldApi.name === getPlaceField(form.state.values.type)) {
          expandPlace(form, onFill)
        }
      },
    },
    onSubmit: () => {
      expandPlace(form, onFill)
      return onSubmit()
    },
    validators: {
      onChange: connectionFormSchema,
      onMount: connectionFormSchema,
      onSubmit: ({ value }) => ({ fields: unfilledSecrets(value) }),
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
      if (patch.type && patch.type !== form.state.values.type) {
        form.setFieldValue('type', patch.type)
      }
      if (patch.sshEnabled) {
        form.setFieldValue('sshEnabled', true)
      }
    },
  }
}

export type ConnectionForm = ReturnType<typeof useConnectionForm>['form']
