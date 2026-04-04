import { SUBSCRIPTION_PAST_DUE_MESSAGE } from '@conar/shared/constants'
import { type } from 'arktype'
import { env } from '~/env'
import { getSubscription, optionalAuthMiddleware, orpc } from '~/orpc'

const bannerType = type({
  text: 'string',
  type: type.enumerated('info', 'warning', 'error', 'success'),
}).array()

export const banner = orpc
  .use(optionalAuthMiddleware)
  .output(bannerType)
  .handler(async ({ context }) => {
    const subscription = context.user ? await getSubscription(context.user.id) : null

    const items: typeof bannerType.infer = []

    if (subscription?.status === 'past_due') {
      items.push({
        text: SUBSCRIPTION_PAST_DUE_MESSAGE,
        type: 'error',
      })
    }

    if (env.BANNER_TEXT) {
      items.push({
        text: env.BANNER_TEXT,
        type: 'info',
      })
    }

    if (env.MIN_DESKTOP_VERSION && context.appVersion?.minor && context.appVersion.minor < env.MIN_DESKTOP_VERSION) {
      items.push({
        text: `You are using an outdated version of the desktop app. Please download the latest version from conar.app/download`,
        type: 'warning',
      })
    }

    if (context.appVersion?.minor && context.appVersion.minor === 25 && context.os === 'linux') {
      items.push({
        text: 'Linux updates broken in 0.25.0 due to provider change. Please download the latest version from conar.app/download',
        type: 'warning',
      })
    }

    if (context.appVersion?.minor && context.appVersion.minor === 28) {
      items.push({
        text: 'Heads up! Conar is becoming Tamery. Our next big update will have the new name - thanks for being part of the journey!',
        type: 'info',
      })
    }

    return items
  })
