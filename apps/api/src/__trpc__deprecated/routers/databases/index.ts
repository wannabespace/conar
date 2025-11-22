import { router } from '~/__trpc__deprecated'
import { create } from './create'
import { list } from './list'
import { remove } from './remove'
import { update } from './update'

export const databasesRouter = router({
  create,
  list,
  remove,
  update,
})
