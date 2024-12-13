import { env } from '@/env'
import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

export const { GET, POST } = toNextJsHandler(async (request) => {
  const origin = request.headers.get('origin')

  const response = await auth.handler(request)

  if (origin && !origin.startsWith(env.NEXT_PUBLIC_URL)) {
    response.headers.set('Access-Control-Allow-Origin', process.env.NODE_ENV === 'production' ? 'tauri://localhost' : 'http://localhost:1420')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Expose-Headers', 'Set-Auth-Token')
  }

  return response
})
