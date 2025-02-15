import { router } from '~/trpc'
import { create } from './create'
import { get } from './get'
import { list } from './list'

export const connectionsRouter = router({
  get,
  create,
  list,
})
