import { createQueryRouter } from '@conar/query-proxy'
import { memoize } from 'memoza'
import { createApiClient } from '~/api-client'
import { authMiddleware, orpc } from '~/orpc'

const resolveQueryConnectionString = memoize(async ({
  input,
  headers,
}: {
  input: { connectionString?: string, resourceId?: string, connectionId?: string }
  headers: Headers
}) => {
  if (input.connectionString) {
    return input.connectionString
  }

  const apiClient = createApiClient({
    authorization: headers.get('authorization'),
    cookie: headers.get('cookie'),
  })

  return apiClient.internal.proxy.resolveConnectionString(input)
}, {
  maxAge: 1000 * 60 * 5, // 5 minutes
})

export const query = createQueryRouter(
  orpc.use(authMiddleware),
  (input, context) => resolveQueryConnectionString({ input, headers: context.headers }),
)
