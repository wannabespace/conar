import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'
import { authClient, bearerToken } from '~/lib/auth'
import { queryClient } from '~/main'
import { subscriptionModalIsOpen } from '~/store'

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

export function useUpgradeSubscription() {
  const { mutate: upgrade, isPending: isUpgrading } = useMutation({
    mutationKey: ['subscription', 'upgrade'],
    mutationFn: async () => {
      const { data, error } = await authClient.subscription.upgrade({
        plan: 'pro',
        disableRedirect: true,
        successUrl: `${import.meta.env.VITE_PUBLIC_WEB_URL}/subscription/success`,
        cancelUrl: `${import.meta.env.VITE_PUBLIC_WEB_URL}/subscription/cancel`,
        returnUrl: `${import.meta.env.VITE_PUBLIC_WEB_URL}/open`,
      })

      if (error) {
        invalidateSubscriptionsQuery()
        throw error
      }

      return data.url!
    },
    onSuccess(url) {
      window.open(url, '_blank')
    },
  })

  return {
    upgrade,
    isUpgrading,
  }
}

export function useCancelSubscription() {
  const { mutate: cancel, isPending: isCancelling } = useMutation({
    mutationKey: ['subscription', 'cancel'],
    mutationFn: async () => {
      const { data, error } = await authClient.subscription.cancel({
        returnUrl: `${import.meta.env.VITE_PUBLIC_WEB_URL}/open`,
        // disableRedirect: true,
      })

      if (error) {
        invalidateSubscriptionsQuery()
        throw error
      }

      return data.url!
    },
    onSuccess(url) {
      window.open(url, '_blank')
      // Temp fix to prevent redirect to the billing portal
      subscriptionModalIsOpen.set(true)
      location.reload()
    },
  })

  return {
    cancel,
    isCancelling,
  }
}

export function useRestoreSubscription() {
  const { mutate: restore, isPending: isRestoring } = useMutation({
    mutationKey: ['subscription', 'restore'],
    mutationFn: async () => {
      const { data, error } = await authClient.subscription.restore()

      if (error) {
        invalidateSubscriptionsQuery()
        throw error
      }

      return data
    },
    onSuccess() {
      invalidateSubscriptionsQuery()
    },
  })

  return {
    restore,
    isRestoring,
  }
}

export function useBillingPortal() {
  const { mutate: openBillingPortal, isPending: isOpening } = useMutation({
    mutationKey: ['subscription', 'billingPortal'],
    mutationFn: async () => {
      const { data, error } = await authClient.subscription.billingPortal({
        returnUrl: `${import.meta.env.VITE_PUBLIC_WEB_URL}/open`,
        // disableRedirect: true,
      })

      if (error) {
        invalidateSubscriptionsQuery()
        throw error
      }

      return data.url!
    },
    onSuccess(url) {
      window.open(url, '_blank')
      // Temp fix to prevent redirect to the billing portal
      subscriptionModalIsOpen.set(true)
      location.reload()
    },
  })

  return {
    openBillingPortal,
    isOpening,
  }
}
