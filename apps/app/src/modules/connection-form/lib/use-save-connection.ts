import type { GuessFormat } from '@tamery/connection/guess'
import { suggestConnectionName } from '@tamery/connection/guess/name'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { tryCatchAsync } from '@tamery/shared/utils'
import type { MutationStatus } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { createConnection } from '~/core/connection/create'
import { testConnectionQuery } from '~/core/queries/connection/test'
import { useLocalProxyAvailable } from '~/core/runtime/proxy'
import { generateRandomName } from '~/utils/faker'

import type { ConnectionFormValues } from './connection-form'
import { draftFetching } from './draft-fetching'

/** Each route persists what it uses: an edit keeps the sync type and never opens or reports an origin. */
export type SavedConnection = Omit<
  Parameters<typeof createConnection>[0],
  'workspaceId'
> & {
  /** Off for a connection that failed its test or cannot be sent from here: opening one fails into the error page, so the save lands on the dashboard. */
  open: boolean
  origin: GuessFormat | undefined
}

export const useSaveConnection = (
  persist: (connection: SavedConnection) => Promise<unknown>
) => {
  const isLocalProxyAvailable = useLocalProxyAvailable()
  const test = useMutation({
    meta: { event: 'connection_tested' },
    mutationFn: (params: { connectionString: string; type: ConnectionType }) =>
      testConnectionQuery.run(params),
  })
  /** A result only counts for the string it tested, so any edit leaves the draft untested. */
  const testStatusOf = (
    connectionString: string,
    type: ConnectionType
  ): MutationStatus =>
    test.variables?.connectionString === connectionString &&
    test.variables.type === type
      ? test.status
      : 'idle'

  const save = async (
    read: () => ConnectionFormValues,
    origin: GuessFormat | undefined
  ): Promise<void> => {
    const values = read()
    const draft = draftFetching(values, isLocalProxyAvailable)
    const status = testStatusOf(draft.connectionString, values.type)
    const failed = status === 'error'
    if (draft.canSend && !failed && status !== 'success') {
      const { error } = await tryCatchAsync(() =>
        test.mutateAsync({
          connectionString: draft.connectionString,
          type: values.type,
        })
      )
      if (error) {
        return
      }
      // An edit during the test leaves what the form holds now untested.
      if (
        draftFetching(read(), isLocalProxyAvailable).connectionString !==
        draft.connectionString
      ) {
        return save(read, origin)
      }
    }
    const current = read()
    const { connectionString } = draftFetching(current, isLocalProxyAvailable)
    if (!connectionString) {
      toast.error("Couldn't save the connection", {
        description: "The host isn't a valid address.",
      })
      return
    }
    const { error } = await tryCatchAsync(() =>
      persist({
        color: current.color,
        connectionString,
        label: current.label.trim() || null,
        name:
          current.name.trim() ||
          suggestConnectionName(current) ||
          generateRandomName(),
        open: draft.canSend && !failed,
        origin,
        syncType: current.syncType,
        type: current.type,
      })
    )
    if (error) {
      toast.error("Couldn't save the connection", {
        description: error.message,
      })
    }
  }

  return { save, test, testStatusOf }
}
