import { useQuery } from '@tanstack/react-query'
import { orpcQuery } from '~/lib/orpc'

export function useSubscriptionsQuery() {
  return useQuery(orpcQuery.account.subscription.list.queryOptions({
    throwOnError: false,
  }))
}

export function useSubscription() {
  const { data: list, isPending } = useSubscriptionsQuery()

  const subscription = list?.find(s => s.status === 'active' || s.status === 'trialing') ?? null

  return { subscription, isPending }
}
