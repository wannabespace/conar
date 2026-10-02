import { createStore } from 'seitu'

import { isAnonymous } from '~/lib/auth'
import { posthog } from '~/lib/posthog'

const NO_GUEST_FEATURES = [
  'ai',
  'connections',
  'edit',
  'server',
  'subscription',
  'sync',
  'tabs',
] as const

export type NoGuestFeature = (typeof NO_GUEST_FEATURES)[number]

const noSignInPrompt: { at: number; feature: NoGuestFeature | null } = {
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

export const isNoGuestFeature = (value: unknown): value is NoGuestFeature =>
  NO_GUEST_FEATURES.some((feature) => feature === value)

export const promptSignIn = (feature: NoGuestFeature) => {
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

export const requestAccess = (feature: NoGuestFeature) => {
  if (isAnonymous()) {
    promptSignIn(feature)
    return
  }

  setIsSubscriptionDialogOpen(true)
}
