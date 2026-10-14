import type { GuessFormat } from '@tamery/connection/guess'
import { suggestConnectionName } from '@tamery/connection/guess/name'
import type { SecretParam } from '@tamery/connection/secrets'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { SyncType } from '@tamery/shared/enums/sync-type'
import { tryCatchAsync } from '@tamery/shared/utils'
import type { MutationStatus } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { useRef } from 'react'
import { toast } from 'sonner'

import type { updateConnection } from '~/core/connection/save'
import { testConnectionQuery } from '~/core/queries/connection/test'
import { useLocalProxyAvailable } from '~/core/runtime/proxy'
import { generateRandomName } from '~/utils/faker'

import type { ConnectionForm, ConnectionFormValues } from './connection-form'
import { draftFetching } from './draft-fetching'

export type FormMode =
  | { kind: 'create' }
  | {
      kind: 'edit'
      name: string
      /** The saved connection has a password this device never held, so an empty field still needs one. */
      passwordElsewhere: boolean
      missingSecrets: SecretParam[]
    }

export type SavedConnection = Parameters<typeof updateConnection>[1]

export interface NewConnection {
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

  /** A result only counts for the string it tested, so any edit leaves the draft untested. */
  const draftOf = (values: ConnectionFormValues) => {
    const draft = draftFetching(values, isLocalProxyAvailable, mode)
    const tested =
      test.variables?.connectionString === draft.connectionString &&
      test.variables.type === values.type
    const testStatus: MutationStatus = tested ? test.status : 'idle'
    return { ...draft, testStatus }
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
    const { connectionString } = draftOf(values)
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
          name:
            values.name.trim() ||
            suggestConnectionName(values) ||
            generateRandomName(),
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
