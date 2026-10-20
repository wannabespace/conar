import { env } from '~/env'
import { orpc } from '~/orpc'

export const proxySecretMiddleware = orpc
  .errors({
    FORBIDDEN: { message: 'Invalid proxy token' },
  })
  .middleware(({ context, errors, next }) => {
    const token = context.headers.get('x-proxy-token')

    if (token !== env.PROXY_SHARED_SECRET) {
      throw errors.FORBIDDEN()
    }

    return next()
  })
