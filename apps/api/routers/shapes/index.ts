import type { AppVariables } from '~/index'
import { Hono } from 'hono'
import { auth } from '~/lib/auth'
import { chatsShape } from './chats'
import { chatsMessagesShape } from './chats-messages'
import { connectionsShape } from './connections'
import { connectionsResourcesShape } from './connections-resources'
import { queriesShape } from './queries'

export interface ShapesVariables extends AppVariables {
  userId: string
}

export const shapesRouter = new Hono<{ Variables: ShapesVariables }>()
  .use(async (c, next) => {
    const data = await auth.api.getSession({ headers: c.req.raw.headers })
    if (!data) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    c.set('userId', data.user.id)
    await next()
  })
  .on(['GET', 'POST'], '/connections', c => connectionsShape(c))
  .on(['GET', 'POST'], '/connections-resources', c => connectionsResourcesShape(c))
  .on(['GET', 'POST'], '/chats', c => chatsShape(c))
  .on(['GET', 'POST'], '/chats-messages', c => chatsMessagesShape(c))
  .on(['GET', 'POST'], '/queries', c => queriesShape(c))
