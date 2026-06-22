import { eq, useLiveQuery } from '@tanstack/react-db'
import { useCollections } from '~/lib/collections'

export function useConnectionStringMetadata(connectionId: string) {
  const { connectionStringsCollection } = useCollections()
  const { data } = useLiveQuery(q =>
    q.from({ cs: connectionStringsCollection })
      .where(({ cs }) => eq(cs.id, connectionId))
      .findOne(),
  )

  return data?.metadata
}
