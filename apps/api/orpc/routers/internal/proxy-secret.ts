import { timingSafeEqual } from 'node:crypto'

import { env } from '~/env'
import { orpc } from '~/orpc'

const secret = Buffer.from(env.PROXY_SHARED_SECRET)

export const proxySecretMiddleware = orpc
  .errors({
    FORBIDDEN: { message: 'Invalid proxy token' },
  })
  .middleware(({ context, errors, next }) => {
    const token = Buffer.from(context.headers.get('x-proxy-token') ?? '')

    if (token.length !== secret.length || !timingSafeEqual(token, secret)) {
      throw errors.FORBIDDEN()
    }

    return next()
  })
