import { router } from '~/__trpc__deprecated'
import { filters } from './filters'

export const aiRouter = router({
  sqlFilters: filters,
})
