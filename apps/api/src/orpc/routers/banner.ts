import { LATEST_VERSION_BEFORE_SUBSCRIPTION } from '@conar/shared/constants'
import { type } from 'arktype'
import { env } from '~/env'
import { orpc } from '~/orpc'

const bannerType = type({
  text: 'string',
  type: type.enumerated('info', 'warning', 'error', 'success'),
}).array()

export const banner = orpc
  .output(bannerType)
  .handler(({ context }) => {
    const items: typeof bannerType.infer = []

    if (context.minorVersion && context.minorVersion < LATEST_VERSION_BEFORE_SUBSCRIPTION) {
      items.push({
        text: 'Some features now require a subscription. Please update the app and subscribe to a plan to continue using them.',
        type: 'info',
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
