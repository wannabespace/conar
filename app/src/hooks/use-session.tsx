import { useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { sessionQuery } from '~/query/auth'

export function useSession() {
  const query = useQuery(sessionQuery())
  const router = useRouter()

  async function refetch() {
    await query.refetch()
    await router.invalidate()
  }

  return {
    isLoading: query.isLoading,
    session: query.data?.data ?? null,
    isAuthenticated: !!query.data?.data?.user,
    refetch,
  }
}
