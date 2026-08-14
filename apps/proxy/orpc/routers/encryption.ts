import { decrypt, encrypt } from '@tamery/shared/utils/crypto-node'
import { type } from 'arktype'

import { authMiddleware, orpc } from '~/orpc'

export const encryption = {
  decrypt: orpc
    .use(authMiddleware)
    .input(
      type({
        encryptedText: 'string',
        secret: 'string',
      })
    )
    .handler(({ input }) => decrypt(input)),
  encrypt: orpc
    .use(authMiddleware)
    .input(
      type({
        secret: 'string',
        text: 'string',
      })
    )
    .handler(({ input }) => encrypt(input)),
}
