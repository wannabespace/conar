import { router } from '~/trpc'
import { get } from './get'

export const profileRouter = router({
  get,
})
