import { protectedProcedure } from '~/trpc'

export const get = protectedProcedure.query(async ({ ctx }) => ctx.user)
