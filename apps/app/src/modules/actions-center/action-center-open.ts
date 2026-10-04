import { createStore } from 'seitu'

import { posthog } from '~/lib/posthog'

export const actionCenterOpen = createStore(false)

actionCenterOpen.subscribe((open) => {
  if (open) {
    posthog.capture('actions_center_opened')
  }
})
