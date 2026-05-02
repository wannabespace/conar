import { decrypt, encrypt } from '@conar/shared/utils/encryption'
import { type } from 'arktype'
import { orpc } from '~/orpc'

export const encryption = {
  encrypt: orpc.input(type('object' as type.cast<Parameters<typeof encrypt>[0]>)).handler(async ({ input }) => encrypt(input)),
  decrypt: orpc.input(type('object' as type.cast<Parameters<typeof decrypt>[0]>)).handler(async ({ input }) => decrypt(input)),
}
