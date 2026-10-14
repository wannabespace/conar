import { connectionParts } from '@tamery/connection/connection-parts'
import type { GuessFormat } from '@tamery/connection/guess'
import type { SecretParam } from '@tamery/connection/secrets'
import { connectionSecrets } from '@tamery/connection/secrets'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { SyncType } from '@tamery/shared/enums/sync-type'
import { SafeURL } from '@tamery/shared/safe-url'
import { tryCatch, tryCatchAsync } from '@tamery/shared/utils'
import type { MutationStatus } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { useRef } from 'react'
import { toast } from 'sonner'

import type { ConnectionString } from '~/core/connection/connection-strings'
import { fetchingConfig } from '~/core/connection/fetching-config'
import type { updateConnection } from '~/core/connection/save'
import type { Connection } from '~/core/connection/sync'
import { testConnectionQuery } from '~/core/queries/connection/test'
import { useLocalProxyAvailable } from '~/core/runtime/proxy'
import { generateRandomName } from '~/utils/faker'

import type { ConnectionForm, ConnectionFormValues } from './connection-form'
import { partsOf } from './connection-form'

export type FormMode =
  | { kind: 'create' }
  | {
      kind: 'edit'
      name: string
      /** The saved connection has a password this device never held, so an empty field still needs one. */
      passwordElsewhere: boolean
      missingSecrets: SecretParam[]
      /** `credentials` opens only what this device lacks, `details` the server details a metadata-only connection never syncs; neither touches the synced row. */
      scope: 'all' | 'credentials' | 'details'
    }

const SECRET_FIELDS: Record<SecretParam, string> = {
  ssh_key: 'ssh.privateKey',
  ssh_passphrase: 'ssh.passphrase',
  ssh_password: 'ssh.password',
  sslpassphrase: 'options',
  sslpassword: 'options',
}

export const editModeOf = (
  connection: Pick<Connection, 'isPasswordExists' | 'name'>,
  stored: ConnectionString | undefined,
  scope: Extract<FormMode, { kind: 'edit' }>['scope']
): FormMode => ({
  kind: 'edit',
  missingSecrets: stored?.missingSecrets ?? [],
  name: connection.name,
  passwordElsewhere:
    connection.isPasswordExists && !stored?.isPasswordPopulated,
  scope,
})

/** Field names the form may not change: under `credentials`, everything but what this device lacks. */
export const lockedFieldOf = (mode: FormMode) => {
  if (mode.kind !== 'edit' || mode.scope !== 'credentials') {
    return () => false
  }
  const open = new Set([
    ...(mode.passwordElsewhere ? ['password'] : []),
    ...mode.missingSecrets.map((param) => SECRET_FIELDS[param]),
  ])
  return (field: string) => !open.has(field)
}

export type SavedConnection = Parameters<typeof updateConnection>[1]

interface NewConnection {
  /** Off for a connection that failed its test or cannot be sent from here: opening one fails into the error page, so the save lands on the dashboard. */
  open: boolean
  origin: GuessFormat | undefined
  syncType: SyncType
}

export type Persist = (
  connection: SavedConnection,
  created: NewConnection
) => Promise<unknown>

export const useSaveConnection = (mode: FormMode, persist: Persist) => {
  const isLocalProxyAvailable = useLocalProxyAvailable()
  const test = useMutation({
    meta: { event: 'connection_tested' },
    mutationFn: (params: { connectionString: string; type: ConnectionType }) =>
      testConnectionQuery.run(params),
  })
  const inFlight = useRef<ReturnType<typeof tryCatchAsync>>(null)

  const draftOf = (values: ConnectionFormValues) => {
    // Host holds whatever is typed until it blurs, so the string may not build yet.
    const connectionString =
      tryCatch(() =>
        connectionParts.format(
          partsOf(values),
          mode.kind === 'edit' ? mode.missingSecrets : []
        )
      ).data ?? ''
    const saved = mode.kind === 'edit' && connectionString ? mode : null
    const hasPassword = !!connectionString && !!values.password
    const { canSend, reason } = fetchingConfig(
      {
        isPasswordExists: hasPassword || !!saved?.passwordElsewhere,
        syncType: values.syncType,
      },
      {
        connectionString: {
          displayUrl:
            tryCatch(() => new SafeURL(connectionString).host).data ?? '',
          isPasswordPopulated: hasPassword,
          missingSecrets: saved
            ? connectionSecrets.missing(
                new SafeURL(connectionString).searchParams
              )
            : [],
          usesSsh: values.sshEnabled,
        },
        isLocalProxyAvailable,
      }
    )
    const tested =
      test.variables?.connectionString === connectionString &&
      test.variables.type === values.type
    const testStatus: MutationStatus = tested ? test.status : 'idle'
    return {
      canSend: canSend && !!connectionString,
      connectionString,
      reason,
      testStatus,
    }
  }

  const runTest = (values: ConnectionFormValues) => {
    const { canSend, connectionString } = draftOf(values)
    if (!canSend) {
      return null
    }
    inFlight.current = tryCatchAsync(() =>
      test.mutateAsync({ connectionString, type: values.type })
    )
    return inFlight.current
  }

  const save = async (
    form: ConnectionForm,
    origin: GuessFormat | undefined
  ): Promise<void> => {
    const draft = draftOf(form.state.values)
    if (
      draft.canSend &&
      (draft.testStatus === 'idle' || draft.testStatus === 'pending')
    ) {
      const result = await (draft.testStatus === 'pending'
        ? inFlight.current
        : runTest(form.state.values))
      if (result?.error) {
        return
      }
      // An edit during the test leaves what the form holds now untested.
      if (
        draftOf(form.state.values).connectionString !== draft.connectionString
      ) {
        return save(form, origin)
      }
    }
    const { values } = form.state
    const { connectionString } = draft
    if (!connectionString) {
      toast.error("Couldn't save the connection", {
        description: "The host isn't a valid address.",
      })
      return
    }
    const { error } = await tryCatchAsync(() =>
      persist(
        {
          color: values.color,
          connectionString,
          label: values.label.trim() || null,
          name: values.name.trim() || generateRandomName(),
          type: values.type,
        },
        {
          open: draft.canSend && draft.testStatus !== 'error',
          origin,
          syncType: values.syncType,
        }
      )
    )
    if (error) {
      toast.error("Couldn't save the connection", {
        description: error.message,
      })
    }
  }

  return { draftOf, runTest, save, testError: test.error }
}
