import type { WebhookEvent } from '@clerk/nextjs/server'
import { userDeleted } from './user-deleted'
import { validateRequest } from './validate'

export async function POST(request: Request) {
  const payload = await validateRequest(request)

  if (!payload)
    return Response.json({ message: 'Webhook signature verification failed.' }, { status: 400 })

  const eventMap = new Map<typeof payload.type, (event: WebhookEvent) => Promise<void>>([
    ['user.deleted', userDeleted],
  ])

  const handler = eventMap.get(payload.type)

  if (!handler)
    return Response.json({ message: 'Clerk handler not found' }, { status: 404 })

  await handler(payload)

  return Response.json({ message: 'Received' })
}
