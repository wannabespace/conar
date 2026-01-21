import { ACTIVE_SUBSCRIPTION_STATUSES } from '@conar/shared/constants'
import { useQuery } from '@tanstack/react-query'
import { orpcQuery } from '~/lib/orpc'
import { subscriptionQueryClient } from '~/main'

export function useSubscription() {
  const { data: list, isPending } = useQuery(orpcQuery.account.subscription.list.queryOptions(), subscriptionQueryClient)

  const subscription = list?.find(s => ACTIVE_SUBSCRIPTION_STATUSES.includes(s.status as typeof ACTIVE_SUBSCRIPTION_STATUSES[number])) ?? null

  return { subscription, isPending }
}
