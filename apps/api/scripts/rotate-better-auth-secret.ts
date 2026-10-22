import * as crypto from 'node:crypto'
import process from 'node:process'

import { infisical } from '@tamery/infisical'
import { toError } from '@tamery/shared/utils'

// Rotates BETTER_AUTH_SECRET in Infisical (project root of the SDK's environment).
// There is nothing to re-encrypt from our side: Better Auth signs sessions/tokens
// and encrypts stored 2FA secrets and OAuth account tokens with this value itself,
// so rotating it is destructive, not a migration. Dry run by default; --execute writes.
const SECRET_BYTES = 32
const SECRET_NAME = 'BETTER_AUTH_SECRET'

const execute = process.argv.includes('--execute')

const value = crypto.randomBytes(SECRET_BYTES).toString('base64')

const consequences = [
  'Every session and bearer token is invalidated, so all users are signed out.',
  'Pending email-OTP, verification and password-reset links stop working.',
  'Stored 2FA secrets and OAuth account tokens become unreadable: users re-enroll 2FA and re-link Google/GitHub.',
  'The API only picks up the new value on redeploy.',
]

console.log(`New ${SECRET_NAME}:\n${value}\n`)
console.log(
  `Consequences of rotating:\n${consequences.map((line) => `  - ${line}`).join('\n')}\n`
)

if (!execute) {
  console.log(
    'Dry run: nothing written. Re-run with --execute to set it in Infisical.'
  )
  process.exit(0)
}

try {
  await infisical.secrets.update({ name: SECRET_NAME, path: [], value })
} catch (error) {
  console.error(
    `Failed to update ${SECRET_NAME} in Infisical: ${toError(error).message}`
  )
  console.error(
    'If the API env is managed elsewhere, set the value above there.'
  )
  process.exit(1)
}

console.log(`${SECRET_NAME} updated in Infisical. Redeploy the API to apply.`)
process.exit(0)
