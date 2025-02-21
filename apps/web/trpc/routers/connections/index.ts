import { router } from '~/trpc'
import { create } from './create'
import { list } from './list'

export const connectionsRouter = router({
  create,
  list,
})
