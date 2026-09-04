import { ACTIVE_SUBSCRIPTION_STATUSES } from '@tamery/shared/constants'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'

import { authClient } from '~/lib/auth'
import { orpc } from '~/lib/orpc'

export const useSubscription = () => {
  const { data } = authClient.useSession()
  const { data: list, isPending } = useQuery(
    orpc.account.subscription.list.queryOptions({
      enabled: !!data?.user.id,
    })
  )

  const subscription =
    list?.find((s) =>
      ACTIVE_SUBSCRIPTION_STATUSES.includes(
        s.status as (typeof ACTIVE_SUBSCRIPTION_STATUSES)[number]
      )
    ) ?? null

  return { isPending, subscription }
}

export const useUpgradeSubscription = (
  clientType: 'web' | 'desktop' | 'cli' | undefined
) => {
  const router = useRouter()
  const returnHref = router.buildLocation({
    search: { type: clientType },
    to: '/account',
  }).href
  const successHref = router.buildLocation({
    search: { subscription: 'success', type: clientType },
    to: '/account',
  }).href
  const cancelHref = router.buildLocation({
    search: { subscription: 'cancel', type: clientType },
    to: '/account',
  }).href

  const { mutate: upgrade, isPending: isUpgrading } = useMutation({
    mutationFn: async (isYearly: boolean) => {
      const result = await orpc.account.subscription.upgrade.call({
        cancelUrl: location.origin + cancelHref,
        isYearly,
        returnUrl: location.origin + returnHref,
        successUrl: location.origin + successHref,
      })

      location.assign(result.url)
    },
    mutationKey: ['subscription', 'upgrade'],
  })

  return {
    isUpgrading,
    upgrade,
  }
}

export const useBillingPortal = ({ returnHref }: { returnHref: string }) => {
  const { mutate, isPending: isOpening } = useMutation(
    orpc.account.subscription.billingPortal.mutationOptions({
      mutationKey: ['subscription', 'billingPortal'],
      onSuccess(result) {
        location.assign(result.url)
      },
    })
  )

  const openBillingPortal = () => {
    mutate({
      returnUrl: location.origin + returnHref,
    })
  }

  return {
    isOpening,
    openBillingPortal,
  }
}
