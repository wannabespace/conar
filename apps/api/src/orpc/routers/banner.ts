import { type } from 'arktype'
import { env } from '~/env'
import { orpc } from '~/orpc'

const bannerType = type({
  text: 'string',
  type: type.enumerated('info', 'warning', 'error', 'success'),
}).array()

export const banner = orpc
  .output(bannerType)
  .handler(() => {
    const items: typeof bannerType.infer = []

    if (env.BANNER_TEXT) {
      items.push({
        text: env.BANNER_TEXT,
        type: 'info',
      })
    }

    return items
  })
