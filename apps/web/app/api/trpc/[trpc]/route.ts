import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { createContext } from '~/trpc/context'
import { appRouter } from '~/trpc/routers'

// In vercel pro we can have maximum 5 minutes execution time
// https://vercel.com/docs/functions/runtimes#max-duration
export const maxDuration = 300

function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`,
            )
          }
        : undefined,
  })
}

export { handler as GET, handler as POST }
