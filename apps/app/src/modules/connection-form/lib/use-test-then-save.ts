import { connectionParts } from '@tamery/connection/connection-parts'
import type { GuessFormat } from '@tamery/connection/guess'
import { describeConnectionString } from '@tamery/connection/utils'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { engines } from '@tamery/shared/enums/connection-type'
import type { SyncType } from '@tamery/shared/enums/sync-type'
import { tryCatch, tryCatchAsync } from '@tamery/shared/utils'
import { useMutation } from '@tanstack/react-query'
import { useRef } from 'react'
import { toast } from 'sonner'

import { fetchingConfig } from '~/core/connection/fetching-config'
import type { ConnectionDetails } from '~/core/connection/save'
import { testConnectionQuery } from '~/core/queries/connection/test'
import { useLocalProxyAvailable } from '~/core/runtime/proxy'
import { generateRandomName } from '~/utils/faker'

import type { ConnectionForm, ConnectionFormValues } from './connection-form'
import { partsOf } from './connection-form'
import type { FormMode } from './form-mode'

export type OnSave = (
  connection: ConnectionDetails,
  created: {
    /** Off for a connection that failed its test or cannot be sent from here: opening one shows only its error, so the save lands on the dashboard. */
    open: boolean
    origin: GuessFormat | undefined
    syncType: SyncType
  }
) => Promise<unknown>

export const useTestThenSave = (mode: FormMode, onSave: OnSave) => {
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
    const described = tryCatch(() =>
      describeConnectionString(connectionString)
    ).data
    const editing = described && mode.kind === 'edit' ? mode : null
    const { canSend, reason } = fetchingConfig(
      {
        isPasswordExists:
          !!described?.isPasswordPopulated || !!editing?.passwordElsewhere,
        syncType: values.syncType,
      },
      {
        connectionString: {
          displayUrl: described?.displayUrl ?? '',
          isPasswordPopulated: !!described?.isPasswordPopulated,
          missingSecrets: (editing && described?.missingSecrets) || [],
          // The form's own switch, not the string: a tunnel with no host yet must still stop the test.
          usesSsh: values.sshEnabled,
        },
        isLocalProxyAvailable,
      }
    )
    const tested =
      test.variables?.connectionString === connectionString &&
      test.variables.type === engines.type(values.engine)
    return {
      canSend: canSend && !!connectionString,
      connectionString,
      reason,
      testStatus: tested ? test.status : 'idle',
    }
  }

  const runTest = (values: ConnectionFormValues) => {
    const { canSend, connectionString } = draftOf(values)
    if (!canSend) {
      return null
    }
    inFlight.current = tryCatchAsync(() =>
      test.mutateAsync({
        connectionString,
        type: engines.type(values.engine),
      })
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
    const { error } = await tryCatchAsync(() => {
      if (!connectionString) {
        throw new Error("The host isn't a valid address.")
      }
      return onSave(
        {
          color: values.color,
          connectionString,
          flavor: engines.flavor(values.engine),
          label: values.label.trim() || null,
          name: values.name.trim() || generateRandomName(),
          type: engines.type(values.engine),
        },
        {
          open: draft.canSend && draft.testStatus !== 'error',
          origin,
          syncType: values.syncType,
        }
      )
    })
    if (error) {
      toast.error("Couldn't save the connection", {
        description: error.message,
      })
    }
  }

  return { draftOf, runTest, save, testError: test.error }
}
