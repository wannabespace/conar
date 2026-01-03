import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { orpc, orpcQuery } from '~/lib/orpc'

export type Subscription = NonNullable<NonNullable<ReturnType<typeof useSubscription>>['subscription']>

export function useSubscriptionsQuery() {
  return useQuery(orpcQuery.account.subscription.list.queryOptions())
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
      const result = await orpc.account.subscription.upgrade({
        returnUrl: returnUrl.href,
        successUrl: successUrl.href,
        cancelUrl: cancelUrl.href,
        isYearly: false,
      })

      location.assign(result.url)
    },
  })

  return {
    upgrade,
    isUpgrading,
  }
}

export function useRestoreSubscription() {
  const queryClient = useQueryClient()

  const { mutate: restore, isPending: isRestoring } = useMutation({
    mutationKey: ['subscription', 'restore'],
    mutationFn: async () => {
      await orpc.account.subscription.restore()
    },
    onSuccess() {
      queryClient.invalidateQueries(orpcQuery.account.subscription.list.queryOptions())
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
      const result = await orpc.account.subscription.billingPortal({
        returnUrl: url.href,
      })

      location.assign(result.url)
    },
  })

  return {
    openBillingPortal,
    isOpening,
  }
}
