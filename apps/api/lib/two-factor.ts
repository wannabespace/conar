import type { HookEndpointContext } from '@better-auth/core'
import { type } from 'arktype'
import { createAuthMiddleware } from 'better-auth/api'
import { twoFactor } from 'better-auth/plugins'

import { env } from '~/env'

const plugin = twoFactor({ allowPasswordless: true })

const twoFactorRedirectSchema = type({ twoFactorRedirect: 'true' })

const isOAuthCallback = (context: HookEndpointContext) =>
  context.path?.startsWith('/callback/') === true

const challengeUrl = (oauthRedirect: Headers | undefined) => {
  const target = new URL(oauthRedirect?.get('location') ?? env.MAIN_URL)
  const search = new URLSearchParams({
    redirectPath: target.pathname + target.search,
  })

  return `${env.MAIN_URL}/two-factor?${search}`
}

// Runs after the challenge, while `location` is still the OAuth callback's own redirect target.
const redirectToChallenge = createAuthMiddleware((ctx) =>
  twoFactorRedirectSchema.allows(ctx.context.returned)
    ? Promise.reject(ctx.redirect(challengeUrl(ctx.context.responseHeaders)))
    : Promise.resolve()
)

// twoFactor() only challenges password sign-ins; without this an emailed code or Google/GitHub skips the TOTP step.
export const twoFactorOnEverySignIn = {
  ...plugin,
  hooks: {
    ...plugin.hooks,
    after: [
      ...plugin.hooks.after.map(({ handler }) => ({
        handler,
        matcher: (context: HookEndpointContext) =>
          context.path === '/sign-in/email-otp' || isOAuthCallback(context),
      })),
      { handler: redirectToChallenge, matcher: isOAuthCallback },
    ],
  },
}
