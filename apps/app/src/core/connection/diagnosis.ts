import { connectionParts } from '@tamery/connection/connection-parts'
import { diagnoseConnectionError } from '@tamery/connection/diagnose'
import { useQuery } from '@tanstack/react-query'

import { useCollections } from '~/core/collections'

export const useDiagnosis = (connectionId: string, error: Error) => {
  const { connectionStringsCollection } = useCollections()
  return useQuery({
    queryFn: async () =>
      diagnoseConnectionError({
        desktop: !!window.electron,
        message: error.message,
        parts: connectionParts.parse(
          await connectionStringsCollection.utils.decrypt(connectionId)
        ),
      }),
    queryKey: ['connection', connectionId, 'diagnosis', error.message],
    throwOnError: false,
  }).data
}
