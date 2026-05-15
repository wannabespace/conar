import { decrypt, encrypt } from '@conar/shared/utils/encryption'
import { type } from 'arktype'
import { orpc } from '~/orpc'

export const encryption = {
  encrypt: orpc
    .input(type({
      text: 'string',
      secret: 'string',
    }))
    .handler(async ({ input }) => encrypt(input)),
  decrypt: orpc
    .input(type({
      encryptedText: 'string',
      secret: 'string',
    }))
    .handler(async ({ input }) => decrypt(input)),
}
