import { router } from '~/trpc'
import { sqlFilters } from './sql-filters'

export const aiRouter = router({
  sqlFilters,
})
