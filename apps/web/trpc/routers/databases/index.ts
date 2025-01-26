import { router } from '~/trpc'
import { create } from './create'
import { get } from './get'
import { list } from './list'

export const databasesRouter = router({
  get,
  create,
  list,
})
