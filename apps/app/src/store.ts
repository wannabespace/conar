import { GUEST_CONNECTIONS_MESSAGE } from '@tamery/shared/constants'
import { createStore } from 'seitu'

import { isAnonymous } from '~/lib/auth'
import { posthog } from '~/lib/posthog'

const GUEST_HINTS = {
  ai: 'AI features need an account.',
  connections: GUEST_CONNECTIONS_MESSAGE,
  subscription: 'That needs an account.',
}

export type GuestFeature = keyof typeof GUEST_HINTS

const noSignInPrompt: { at: number; hint: string | null } = {
  at: 0,
  hint: null,
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

export const promptSignIn = (hint: string) => {
  void posthog.capture('guest_feature_blocked', { hint })
  appStore.set(
    (state) =>
      ({
        ...state,
        signInPrompt: { at: Date.now(), hint },
      }) satisfies typeof state
  )
}

export const setIsSubscriptionDialogOpen = (isOpen: boolean) => {
  appStore.set(
    (state) =>
      ({ ...state, isSubscriptionDialogOpen: isOpen }) satisfies typeof state
  )
}

export const requestUpgrade = (feature: GuestFeature) => {
  if (isAnonymous()) {
    promptSignIn(GUEST_HINTS[feature])
  } else {
    setIsSubscriptionDialogOpen(true)
  }
}
