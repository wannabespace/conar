import type { WebhookEvent } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { env } from '~/env'

export async function validateRequest(request: Request) {
  try {
    const payloadString = await request.text()
    const headerPayload = await headers()

    const svixHeaders = {
      'svix-id': headerPayload.get('svix-id')!,
      'svix-timestamp': headerPayload.get('svix-timestamp')!,
      'svix-signature': headerPayload.get('svix-signature')!,
    }
    const wh = new Webhook(env.CLERK_WEBHOOK_SECRET)
    return wh.verify(payloadString, svixHeaders) as WebhookEvent
  }
  catch {
    return null
  }
}
