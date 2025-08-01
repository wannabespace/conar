import { router } from '~/trpc'
import { list } from './list'
import { remove } from './remove'

export const chatsRouter = router({
  list,
  remove,
})
