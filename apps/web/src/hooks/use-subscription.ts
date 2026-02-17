import { ACTIVE_SUBSCRIPTION_STATUSES } from '@conar/shared/constants'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { orpc, orpcQuery } from '~/lib/orpc'

export function useSubscription() {
  const { data: list, isPending } = useQuery(orpcQuery.account.subscription.list.queryOptions())

  const subscription = list?.find(s => ACTIVE_SUBSCRIPTION_STATUSES.includes(s.status as typeof ACTIVE_SUBSCRIPTION_STATUSES[number])) ?? null

  return { subscription, isPending }
}

export function useUpgradeSubscription() {
  const router = useRouter()
  const returnHref = router.buildLocation({ to: '/account' }).href
  const successHref = router.buildLocation({ to: '/account', search: { subscription: 'success' } }).href
  const cancelHref = router.buildLocation({ to: '/account', search: { subscription: 'cancel' } }).href

  const { mutate: upgrade, isPending: isUpgrading } = useMutation({
    mutationKey: ['subscription', 'upgrade'],
    mutationFn: async (isYearly: boolean = false) => {
      const result = await orpc.account.subscription.upgrade({
        returnUrl: location.origin + returnHref,
        successUrl: location.origin + successHref,
        cancelUrl: location.origin + cancelHref,
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

export function useBillingPortal({ returnHref }: { returnHref: string }) {
  const { mutate: openBillingPortal, isPending: isOpening } = useMutation({
    mutationKey: ['subscription', 'billingPortal'],
    mutationFn: async () => {
      const result = await orpc.account.subscription.billingPortal({
        returnUrl: location.origin + returnHref,
      })

      location.assign(result.url)
    },
  })

  return {
    openBillingPortal,
    isOpening,
  }
}
