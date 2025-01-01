import { router } from '~/trpc'
import { manage } from './manage'

export const subscriptionsRouter = router({
  manage,
})
