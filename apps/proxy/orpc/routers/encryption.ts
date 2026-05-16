import { decrypt, encrypt } from '@conar/shared/utils/encryption'
import { type } from 'arktype'
import { authMiddleware, orpc } from '~/orpc'

export const encryption = {
  encrypt: orpc
    .use(authMiddleware)
    .input(type({
      text: 'string',
      secret: 'string',
    }))
    .handler(async ({ input }) => encrypt(input)),
  decrypt: orpc
    .use(authMiddleware)
    .input(type({
      encryptedText: 'string',
      secret: 'string',
    }))
    .handler(async ({ input }) => decrypt(input)),
}
