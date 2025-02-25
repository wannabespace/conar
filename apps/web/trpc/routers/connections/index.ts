import { router } from '~/trpc'
import { create } from './create'
import { list } from './list'
import { remove } from './remove'

export const connectionsRouter = router({
  create,
  list,
  remove,
})
