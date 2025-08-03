import { router } from '~/trpc'
import { filters } from './filters'

export const aiRouter = router({
  sqlFilters: filters,
})
