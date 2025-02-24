import { useQuery } from '@tanstack/react-query'
import { sessionQuery } from '~/queries/auth'

export function useSession() {
  const query = useQuery(sessionQuery())

  return {
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    data: query.data?.data ?? null,
    isAuthenticated: !!query.data?.data?.user,
    refetch: query.refetch,
  }
}
