import { z } from 'zod'
import { encodeBase64 } from '~/lib/base64'
import { encrypt as encryptLib } from '~/lib/crypto'
import { publicProcedure } from '~/trpc'

export const encrypt = publicProcedure
  .input(z.object({ data: z.string(), secret: z.string() }))
  .mutation(async ({ input }) => {
    return encodeBase64(JSON.stringify(encryptLib(input.data, input.secret)))
  })
