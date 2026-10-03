import { ACTIVE_SUBSCRIPTION_STATUSES } from '@tamery/shared/constants'
import { useQuery } from '@tanstack/react-query'

import { authClient } from '~/lib/auth'
import { orpc } from '~/lib/orpc'
import { subscriptionQueryClient } from '~/lib/query-client'

export const isActiveSubscription = ({ status }: { status: string | null }) =>
  ACTIVE_SUBSCRIPTION_STATUSES.includes(
    status as (typeof ACTIVE_SUBSCRIPTION_STATUSES)[number]
  )

export const useSubscription = () => {
  const { data } = authClient.useSession()
  const { data: list, isLoading } = useQuery(
    orpc.account.subscription.list.queryOptions({
      enabled: !!data && !data.user.isAnonymous,
    }),
    subscriptionQueryClient
  )

  const subscription = list?.find(isActiveSubscription) ?? null

  return { isLoading, subscription }
}
