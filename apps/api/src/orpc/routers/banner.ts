import { LATEST_VERSION_BEFORE_SUBSCRIPTION, SUBSCRIPTION_PAST_DUE_MESSAGE } from '@conar/shared/constants'
import { type } from 'arktype'
import { env } from '~/env'
import { stripe } from '~/lib/stripe'
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

    if (stripe
      && context.minorVersion
      && context.minorVersion < LATEST_VERSION_BEFORE_SUBSCRIPTION
    ) {
      items.push({
        text: 'Some features now require a subscription. Please update the app and subscribe to a plan to continue using them.',
        type: 'info',
      })
    }

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

    if (context.desktopVersion === '0.25.0' && context.ua?.getOS().name === 'Linux') {
      items.push({
        text: 'Linux updates broken in 0.25.0 due to provider change. Please download new version manually on conar.app/download',
        type: 'warning',
      })
    }

    return items
  })
