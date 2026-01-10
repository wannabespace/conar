import { ACTIVE_SUBSCRIPTION_STATUSES } from '@conar/shared/constants'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { orpc, orpcQuery } from '~/lib/orpc'

export type Subscription = NonNullable<NonNullable<ReturnType<typeof useSubscription>>['subscription']>

export function useSubscription() {
  const { data: list, isPending } = useQuery(orpcQuery.account.subscription.list.queryOptions())

  const subscription = list?.find(s => ACTIVE_SUBSCRIPTION_STATUSES.includes(s.status as typeof ACTIVE_SUBSCRIPTION_STATUSES[number])) ?? null

  return { subscription, isPending }
}

export function useUpgradeSubscription() {
  const router = useRouter()
  const { url: returnUrl } = router.buildLocation({ to: '/account' })
  const { url: successUrl } = router.buildLocation({ to: '/account', search: { subscription: 'success' } })
  const { url: cancelUrl } = router.buildLocation({ to: '/account', search: { subscription: 'cancel' } })

  const { mutate: upgrade, isPending: isUpgrading } = useMutation({
    mutationKey: ['subscription', 'upgrade'],
    mutationFn: async (isYearly: boolean = false) => {
      const result = await orpc.account.subscription.upgrade({
        returnUrl: returnUrl.href,
        successUrl: successUrl.href,
        cancelUrl: cancelUrl.href,
        isYearly,
      })

      location.assign(result.url)
    },
  })

  return {
    upgrade,
    isUpgrading,
  }
}

export function useBillingPortal({ returnUrl}: { returnUrl: string }) {
  const { mutate: openBillingPortal, isPending: isOpening } = useMutation({
    mutationKey: ['subscription', 'billingPortal'],
    mutationFn: async () => {
      const result = await orpc.account.subscription.billingPortal({
        returnUrl,
      })

      location.assign(result.url)
    },
  })

  return {
    openBillingPortal,
    isOpening,
  }
}
