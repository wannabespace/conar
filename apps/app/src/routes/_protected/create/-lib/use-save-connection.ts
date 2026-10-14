import type { GuessFormat } from '@tamery/connection/guess'
import { suggestConnectionName } from '@tamery/connection/guess/name'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { silently, tryCatchAsync } from '@tamery/shared/utils'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { testConnectionQuery } from '~/core/queries/connection/test'
import { useLocalProxyAvailable } from '~/core/runtime/proxy'
import { generateRandomName } from '~/utils/faker'

import type { ConnectionFormValues } from './connection-form'
import { draftFetching } from './draft-fetching'
import { useCreateConnection } from './use-create-connection'

export const useSaveConnection = () => {
  const isLocalProxyAvailable = useLocalProxyAvailable()
  const createConnection = useCreateConnection()
  const test = useMutation({
    meta: { event: 'connection_tested' },
    mutationFn: (params: { connectionString: string; type: ConnectionType }) =>
      testConnectionQuery.run(params),
  })

  const save = async (
    read: () => ConnectionFormValues,
    origin: GuessFormat | undefined
  ): Promise<void> => {
    const values = read()
    const draft = draftFetching(values, isLocalProxyAvailable)
    const failed = test.status === 'error'
    if (draft.canSend && !failed && test.status !== 'success') {
      const { error } = await tryCatchAsync(() =>
        test.mutateAsync({
          connectionString: draft.connectionString,
          type: values.type,
        })
      )
      if (error) {
        return
      }
      // An edit during the test resets it but not this promise: test what the form holds now.
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
    await silently(() =>
      createConnection.mutateAsync({
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
  }

  return { save, test }
}
