import { posthog } from '~/lib/posthog'

export const restartToUnlock = () => {
  posthog.capture('app_restarted_to_unlock')
  window.electron?.app.relaunch()
}
