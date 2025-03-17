import { createAPIFileRoute } from '@tanstack/react-start/api'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { createContext } from '~/trpc/context'
import { appRouter } from '~/trpc/routers'

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

export const APIRoute = createAPIFileRoute('/api/tprc/$')({
  GET: ({ request }) => {
    return handler(request)
  },
  POST: ({ request }) => {
    return handler(request)
  },
})
