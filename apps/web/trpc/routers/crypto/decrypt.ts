import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { decodeBase64 } from '~/lib/base64'
import { decrypt as decryptLib } from '~/lib/crypto'
import { publicProcedure } from '~/trpc'

export const decrypt = publicProcedure
  .input(z.object({ encryptedText: z.string(), secret: z.string() }))
  .mutation(async ({ input }) => {
    const decrypted = decryptLib(JSON.parse(decodeBase64(input.encryptedText)), input.secret)

    if (!decrypted) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to decrypt data',
      })
    }

    return decrypted
  })
