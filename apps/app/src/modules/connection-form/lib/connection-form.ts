import type { ConnectionParts } from '@tamery/connection/connection-parts'
import { connectionParts } from '@tamery/connection/connection-parts'
import type { ConnectionPatch } from '@tamery/connection/diagnosis'
import type { ConnectionGuess } from '@tamery/connection/guess'
import { guessConnection } from '@tamery/connection/guess'
import { isLocalHost } from '@tamery/connection/hosts'
import type { SqliteLocation } from '@tamery/connection/sqlite-remote'
import { getSqliteLocation } from '@tamery/connection/sqlite-remote'
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

import {
  getPlaceField,
  getPlaceMessage,
  getSqliteParts,
  opensFile,
  SQLITE_NEEDED,
} from './sqlite-location'
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
  /** Only read for SQLite. */
  sqliteLocation: SqliteLocation
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
  sqliteLocation: 'file',
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

const FULL_PATH = /^\s*(?:\/|~\/|[a-z]:[\\/])/iu

const connectionFormSchema = type({
  database: 'string',
  host: 'string',
  port,
  sqliteLocation: "'d1' | 'file' | 'libsql'",
  ssh: { host: 'string', port },
  sshEnabled: 'boolean',
  type: type.valueOf(ConnectionType),
})
  .narrow((values, ctx) => {
    const field = getPlaceField(values)
    return (
      /\S/u.test(values[field]) ||
      ctx.reject({ message: getPlaceMessage(values), path: [field] })
    )
  })
  .narrow(
    (values, ctx) =>
      !opensFile(values) ||
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
  const sqliteLocation = getSqliteLocation(parts?.host ?? '')
  return {
    ...DEFAULT_VALUES,
    ...(parts && pick(parts, [...SERVER_FIELDS, 'https'])),
    ...(sqliteLocation === 'd1' && { host: '' }),
    color: connection.color,
    label: connection.label ?? '',
    name: connection.name,
    sqliteLocation,
    ssh: parts?.ssh ?? EMPTY_SSH_TUNNEL,
    sshEnabled: !!parts?.ssh,
    syncType: connection.syncType,
    type: connection.type,
  }
}

export const getParts = (values: ConnectionFormValues): ConnectionParts => {
  const parts = {
    ...pick(values, [...SERVER_FIELDS, 'https']),
    ssh: values.sshEnabled ? values.ssh : null,
    type: values.type,
  }
  return values.type === ConnectionType.SQLite
    ? getSqliteParts(parts, values.sqliteLocation)
    : parts
}

const BARE_HOST = /^[\w.:%[\]-]+$/u
const NEEDED_FIELDS = ['host', 'user', 'password'] as const

export const getMissing = (values: ConnectionFormValues) =>
  (values.type === ConnectionType.SQLite
    ? SQLITE_NEEDED[values.sqliteLocation]
    : NEEDED_FIELDS
  ).filter(
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
  if (parts.type === ConnectionType.SQLite) {
    const sqliteLocation = getSqliteLocation(parts.host ?? '')
    form.setFieldValue('sqliteLocation', sqliteLocation)
    if (sqliteLocation === 'd1') {
      form.setFieldValue('host', '')
    }
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
  const { values } = form.state
  const field = getPlaceField(values)
  const value = values[field]
  const guess = guessConnection(value)
  const expands =
    values.type === ConnectionType.SQLite
      ? guess?.parts.type === ConnectionType.SQLite &&
        guess.parts[field] !== value
      : guess && (guess.format !== 'host' || guess.parts.host !== value)
  if (guess && expands) {
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
        if (fieldApi.name === getPlaceField(form.state.values)) {
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
