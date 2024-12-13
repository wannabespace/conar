import { env } from '@/env'
import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

export const { GET, POST } = toNextJsHandler((r) => {
  if (!r.url.startsWith(env.NEXT_PUBLIC_URL)) {
    r.headers.set('Access-Control-Allow-Origin', process.env.NODE_ENV === 'production' ? 'tauri://localhost' : 'http://localhost:1420')
    r.headers.set('Access-Control-Allow-Credentials', 'true')
    r.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    r.headers.set('Access-Control-Expose-Headers', 'Set-Auth-Token')
  }

  return auth.handler(r)
})
