import { useQuery } from '@tanstack/react-query'
import { sessionQuery } from '~/query/auth'

export function useSession() {
  const query = useQuery(sessionQuery())

  async function refetch() {
    await query.refetch()
  }

  return {
    isLoading: query.isLoading,
    session: query.data?.data ?? null,
    isAuthenticated: !!query.data?.data?.user,
    refetch,
  }
}
