import { useQuery } from '@tanstack/react-query'
import { orpcQuery } from '~/lib/orpc'
import { subscriptionQueryClient } from '~/main'

export function useSubscription() {
  const { data: list, isPending } = useQuery(orpcQuery.account.subscription.list.queryOptions(), subscriptionQueryClient)

  const subscription = list?.find(s => s.status === 'active' || s.status === 'trialing') ?? null

  return { subscription, isPending }
}
