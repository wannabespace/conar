import { createAPIFileRoute } from '@tanstack/react-start/api'
import { auth } from '~/lib/auth'

export const APIRoute = createAPIFileRoute('/api/auth/$')({
  GET: async ({ request }) => {
    return auth.handler(request)
  },
  POST: async ({ request }) => {
    return auth.handler(request)
  },
})
