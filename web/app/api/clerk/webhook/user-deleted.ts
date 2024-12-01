import type { WebhookEvent } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'
import { db, subscriptions } from '~/drizzle'

export async function userDeleted(event: WebhookEvent) {
  const { id } = event.data

  if (!id)
    return

  await db.delete(subscriptions).where(eq(subscriptions.userId, id))
}
