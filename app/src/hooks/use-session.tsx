import { useQuery } from '@tanstack/react-query'
import { sessionQuery } from '~/query/auth'

export function useSession() {
  const query = useQuery(sessionQuery())

  return query
}
