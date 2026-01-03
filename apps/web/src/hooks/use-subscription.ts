import type { QueryClient } from '@tanstack/react-query'
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { authClient } from '~/lib/auth'

export type Subscription = NonNullable<NonNullable<ReturnType<typeof useSubscription>>['subscription']>

const subscriptionsOptions = queryOptions({
  queryKey: ['subscription', 'list'],
  queryFn: async () => {
    const { data, error } = await authClient.subscription.list()

    if (error) {
      throw error
    }

    return data
  },
})

export function invalidateSubscriptionsQuery(queryClient: QueryClient) {
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

export function useUpgradeSubscription() {
  const router = useRouter()
  const { url: returnUrl } = router.buildLocation({ to: '/account' })
  const { url: successUrl } = router.buildLocation({ to: '/account', search: { subscription: 'success' } })
  const { url: cancelUrl } = router.buildLocation({ to: '/account', search: { subscription: 'cancel' } })

  const { mutate: upgrade, isPending: isUpgrading } = useMutation({
    mutationKey: ['subscription', 'upgrade'],
    mutationFn: async () => {
      const { error } = await authClient.subscription.upgrade({
        plan: 'pro',
        returnUrl: returnUrl.href,
        successUrl: successUrl.href,
        cancelUrl: cancelUrl.href,
      })

      if (error) {
        throw error
      }
    },
  })

  return {
    upgrade,
    isUpgrading,
  }
}

export function useCancelSubscription() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { url } = router.buildLocation({ to: '/account' })

  const { mutate: cancel, isPending: isCancelling } = useMutation({
    mutationKey: ['subscription', 'cancel'],
    mutationFn: async () => {
      const { error } = await authClient.subscription.cancel({
        returnUrl: url.href,
      })

      if (error) {
        invalidateSubscriptionsQuery(queryClient)
        throw error
      }
    },
  })

  return {
    cancel,
    isCancelling,
  }
}

export function useRestoreSubscription() {
  const queryClient = useQueryClient()

  const { mutate: restore, isPending: isRestoring } = useMutation({
    mutationKey: ['subscription', 'restore'],
    mutationFn: async () => {
      const { data, error } = await authClient.subscription.restore()

      if (error) {
        invalidateSubscriptionsQuery(queryClient)
        throw error
      }

      return data
    },
    onSuccess() {
      invalidateSubscriptionsQuery(queryClient)
    },
  })

  return {
    restore,
    isRestoring,
  }
}

export function useBillingPortal() {
  const router = useRouter()
  const { url } = router.buildLocation({ to: '/account' })

  const { mutate: openBillingPortal, isPending: isOpening } = useMutation({
    mutationKey: ['subscription', 'billingPortal'],
    mutationFn: async () => {
      const { data, error } = await authClient.subscription.billingPortal({
        returnUrl: url.href,
      })

      if (error) {
        throw error
      }

      return data.url!
    },
  })

  return {
    openBillingPortal,
    isOpening,
  }
}
