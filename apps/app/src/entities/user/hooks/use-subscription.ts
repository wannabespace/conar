import { ACTIVE_SUBSCRIPTION_STATUSES } from '@conar/shared/constants'
import { useQuery } from '@tanstack/react-query'
import { authClient } from '~/lib/auth'
import { orpc } from '~/lib/orpc'
import { subscriptionQueryClient } from '~/main'

export function useSubscription() {
  const { data } = authClient.useSession()
  const { data: list, isPending } = useQuery(orpc.account.subscription.list.queryOptions({
    enabled: !!data?.user.id,
  }), subscriptionQueryClient)

  const subscription = list?.find(s => ACTIVE_SUBSCRIPTION_STATUSES.includes(s.status as typeof ACTIVE_SUBSCRIPTION_STATUSES[number])) ?? null

  return { subscription, isPending }
}
