import { type } from 'arktype'
import { orpc } from '~/orpc'

const bannerType = type({
  text: 'string',
  type: type.enumerated('info', 'warning', 'error', 'success'),
})

export const display = orpc
  .output(bannerType.or('null'))
  .handler(() => {
    return {
      text: 'Scheduled maintenance on Nov 20th, 2025 from 2-4 PM UTC',
      type: 'success',
    }
  })
