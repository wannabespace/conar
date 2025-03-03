import { router } from '~/trpc'
import { generateSql } from './generate-sql'

export const aiRouter = router({
  generateSql,
})
