import { router } from '~/trpc'
import { create } from './create'
import { list } from './list'
import { remove } from './remove'

export const databasesRouter = router({
  create,
  list,
  remove,
})
