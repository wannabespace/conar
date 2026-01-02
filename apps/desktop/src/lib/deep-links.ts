import { toast } from 'sonner'
import { invalidateSubscriptionsQuery } from '~/entities/user/hooks/use-subscription'
import { bearerToken, codeChallenge, successAuthToast } from '~/lib/auth'
import { decrypt } from './encryption'

export async function handleDeepLink(url: string): Promise<{
  type:
    | 'session'
    | 'unknown'
    | 'subscription-success'
    | 'subscription-cancel'
}> {
  const { pathname, searchParams } = new URL(url.replace('conar://', 'https://conar.app/'))

  if (pathname === '/session') {
    await handleSession(searchParams)

    return {
      type: 'session',
    }
  }

  if (pathname === '/subscription/success') {
    await handleSubscriptionSuccess()

    return {
      type: 'subscription-success',
    }
  }

  if (pathname === '/subscription/cancel') {
    await handleSubscriptionCancel()

    return {
      type: 'subscription-cancel',
    }
  }

  return {
    type: 'unknown',
  }
}

export async function handleSession(searchParams: URLSearchParams) {
  const persistedCodeChallenge = codeChallenge.get()

  if (!persistedCodeChallenge) {
    return
  }

  const token = searchParams.get('token')
  const code = searchParams.get('code-challenge')
  const newUser = searchParams.get('new-user')

  if (!code || !token) {
    toast.error('We couldn\'t find your sign in token. Please try signing in again.')
    return
  }

  const decryptedCodeChallenge = await decrypt(code, import.meta.env.VITE_PUBLIC_AUTH_SECRET)

  if (!decryptedCodeChallenge) {
    toast.error('We couldn\'t decrypt your code challenge. Please try signing in again.')
    return
  }

  if (decryptedCodeChallenge !== persistedCodeChallenge) {
    toast.error('Your sign in token has already been used. Please try signing in again.')
    return
  }

  bearerToken.set(token)
  codeChallenge.remove()
  successAuthToast(!!newUser)
}

export async function handleSubscriptionSuccess() {
  invalidateSubscriptionsQuery()
  toast.success('Subscription successful', {
    description: 'You\'re now a Conar Pro subscriber. Enjoy all your new features.',
  })
}

export async function handleSubscriptionCancel() {
  invalidateSubscriptionsQuery()
  toast.info('Subscription cancelled', {
    description: 'Your subscription has been cancelled. You can continue using Conar without a subscription.',
  })
}
