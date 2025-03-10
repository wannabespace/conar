import type { Context } from '~/trpc/context'
import { initTRPC, TRPCError } from '@trpc/server'
import SuperJSON from 'superjson'
import { ZodError } from 'zod'
import { auth } from '~/lib/auth'

const t = initTRPC.context<Context>().create({
  transformer: SuperJSON,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
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
