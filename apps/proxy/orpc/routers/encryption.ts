import { decrypt, encrypt } from '@conar/shared/utils/encryption'
import { type } from 'arktype'
import { authMiddleware, orpc } from '~/orpc'

export const encryption = {
  encrypt: orpc
    .use(authMiddleware)
    .input(type('object' as type.cast<Parameters<typeof encrypt>[0]>))
    .handler(async ({ input }) => encrypt(input)),
  decrypt: orpc
    .use(authMiddleware)
    .input(type('object' as type.cast<Parameters<typeof decrypt>[0]>))
    .handler(async ({ input }) => decrypt(input)),
}
