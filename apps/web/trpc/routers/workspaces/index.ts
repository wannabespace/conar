import { router } from '~/trpc'
import { list } from './list'

export const workspacesRouter = router({
  list,
})
