import { queryOptions, useQuery } from '@tanstack/react-query'
import { authClient, bearerToken } from '~/lib/auth'
import { queryClient } from '~/main'

export type Subscription = NonNullable<NonNullable<ReturnType<typeof useSubscription>>['subscription']>

const subscriptionsOptions = queryOptions({
  queryKey: ['subscription', 'list'],
  queryFn: async () => {
    if (!bearerToken.get()) {
      return null
    }

    const { data, error } = await authClient.subscription.list()

    if (error) {
      throw error
    }

    return data
  },
})

export function invalidateSubscriptionsQuery() {
  queryClient.invalidateQueries(subscriptionsOptions)
}

export function useSubscriptionsQuery() {
  return useQuery(subscriptionsOptions)
}

export function useSubscription() {
  const { data: list, isPending } = useSubscriptionsQuery()

  const subscription = list?.find(s => s.status === 'active' || s.status === 'trialing') ?? null

  return { subscription, isPending }
}
