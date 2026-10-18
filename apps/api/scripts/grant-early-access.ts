import process from 'node:process'

import { db } from '@tamery/db'
import { earlyAccess } from '@tamery/db/schema'

import { sendEmail } from '~/lib/resend'

const emails = process.argv.slice(2).map((email) => email.toLowerCase())

if (emails.length === 0) {
  console.log('Usage: bun scripts/grant-early-access.ts <email> [email...]')
  process.exit(1)
}

const grantedAt = new Date()

await db
  .insert(earlyAccess)
  .values(emails.map((email) => ({ email, grantedAt })))
  .onConflictDoUpdate({ set: { grantedAt }, target: earlyAccess.email })

await Promise.all(
  emails.map((email) =>
    sendEmail({
      subject: 'Welcome to Tamery — your early access is ready!',
      template: 'EarlyAccessGranted',
      to: email,
    })
  )
)

console.log(`Granted early access to ${emails.join(', ')}.`)
process.exit(0)
