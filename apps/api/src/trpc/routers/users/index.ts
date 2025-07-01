import { router } from '~/trpc'
import { count } from './count'

export const usersRouter = router({
  count,
})
