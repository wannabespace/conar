import type { Context } from '~/trpc/context'
import { initTRPC, TRPCError } from '@trpc/server'
import { TraversalError } from 'arktype'
import SuperJSON from 'superjson'
import { auth } from '~/lib/auth'

const t = initTRPC.context<Context>().create({
  transformer: SuperJSON,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        arktypeError:
          error.cause instanceof TraversalError ? error.cause.message : null,
      },
    }
  },
})

export const router = t.router

export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const session = await auth.api.getSession({
    headers: ctx.headers,
  })

  if (!session) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'We could not find your session. Please sign in again.' })
  }

  return next({
    ctx: {
      ...ctx,
      ...session,
    },
  })
})
