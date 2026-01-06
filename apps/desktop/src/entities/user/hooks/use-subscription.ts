import { useQuery } from '@tanstack/react-query'
import { orpcQuery } from '~/lib/orpc'
import { subscriptionQueryClient } from '~/main'

export function useSubscriptionsQuery() {
  return useQuery(orpcQuery.account.subscription.list.queryOptions(), subscriptionQueryClient)
}

export function useSubscription() {
  const { data: list, isPending } = useSubscriptionsQuery()

  const subscription = list?.find(s => s.status === 'active' || s.status === 'trialing') ?? null

  return { subscription, isPending }
}
