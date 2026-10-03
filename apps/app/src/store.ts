import { createStore } from 'seitu'

import { isAnonymous } from '~/lib/auth'
import { posthog } from '~/lib/posthog'

export const GUEST_LOCKED_FEATURES = {
  ai: 'ai',
  connections: 'connections',
  server: 'server',
  subscription: 'subscription',
  sync: 'sync',
} as const

export type GuestLockedFeature = keyof typeof GUEST_LOCKED_FEATURES

const noSignInPrompt: { at: number; feature: GuestLockedFeature | null } = {
  at: 0,
  feature: null,
}

export const appStore = createStore({
  isOnline: window.navigator.onLine,
  isSubscriptionDialogOpen: false,
  signInPrompt: noSignInPrompt,
})

const updateOnline = () => {
  appStore.set(
    (state) =>
      ({ ...state, isOnline: window.navigator.onLine }) satisfies typeof state
  )
}

window.addEventListener('online', () => updateOnline())
window.addEventListener('offline', () => updateOnline())

export const isGuestLockedFeature = (
  value: unknown
): value is GuestLockedFeature =>
  typeof value === 'string' && Object.hasOwn(GUEST_LOCKED_FEATURES, value)

export const promptSignIn = (feature: GuestLockedFeature) => {
  void posthog.capture('guest_feature_blocked', { feature })
  appStore.set(
    (state) =>
      ({
        ...state,
        signInPrompt: { at: Date.now(), feature },
      }) satisfies typeof state
  )
}

export const setIsSubscriptionDialogOpen = (isOpen: boolean) => {
  appStore.set(
    (state) =>
      ({ ...state, isSubscriptionDialogOpen: isOpen }) satisfies typeof state
  )
}

// Guests can't subscribe: their locked controls are disabled and report through the guest banner instead.
export const requestUpgrade = () => {
  if (!isAnonymous()) {
    setIsSubscriptionDialogOpen(true)
  }
}
