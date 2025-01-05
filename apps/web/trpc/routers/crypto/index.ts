import { router } from '~/trpc'
import { decrypt } from './decrypt'
import { encrypt } from './encrypt'

export const cryptoRouter = router({
  encrypt,
  decrypt,
})
