import { ACTIVE_SUBSCRIPTION_STATUSES } from '@tamery/shared/constants'
import { useQuery } from '@tanstack/react-query'
import { type } from 'arktype'
import { useEffect } from 'react'
import { createWebStorageValue } from 'seitu/web'

import { authClient } from '~/lib/auth'
import type { ORPCOutputs } from '~/lib/orpc'
import { orpc } from '~/lib/orpc'
import { subscriptionQueryClient } from '~/lib/query-client'

const SUBSCRIPTIONS_CACHE_KEY = 'tamery.subscriptions'

export const subscriptionsCache = createWebStorageValue({
  defaultValue: null,
  key: SUBSCRIPTIONS_CACHE_KEY,
  schema: type('object[] | null').as<
    ORPCOutputs['account']['subscription']['list'] | null
  >(),
  type: 'localStorage',
})

export const subscriptionsQueryOptions =
  orpc.account.subscription.list.queryOptions({
    initialData: () => subscriptionsCache.get() ?? undefined,
  })

export const isActiveSubscription = ({ status }: { status: string | null }) =>
  ACTIVE_SUBSCRIPTION_STATUSES.includes(
    status as (typeof ACTIVE_SUBSCRIPTION_STATUSES)[number]
  )

export const useSubscription = () => {
  const { data } = authClient.useSession()
  const { data: list, isLoading } = useQuery(
    {
      ...subscriptionsQueryOptions,
      enabled: !!data && !data.user.isAnonymous,
    },
    subscriptionQueryClient
  )

  useEffect(() => {
    if (list) {
      subscriptionsCache.set(list)
    }
  }, [list])

  const subscription = list?.find(isActiveSubscription) ?? null

  return { isLoading, subscription }
}
