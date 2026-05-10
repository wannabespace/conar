import process from 'node:process'
import { consola } from 'consola'
import ora from 'ora'
import { clearStoredAuth, CONAR_API_KEY_ENV, getAuthState } from '~/config'

export interface Session {
  user: {
    id: string
    email: string
    name?: string | null
  }
}

export async function getSessionFromToken(token: string): Promise<Session | null> {
  if (!token) {
    return null
  }

  try {
    const res = await fetch(`${import.meta.env.API_URL}/auth/get-session`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      return null
    }

    const data = await res.json() as Session | null

    if (!data?.user?.id) {
      return null
    }

    return data
  }
  catch {
    return null
  }
}

export async function getSession(): Promise<Session | null> {
  const auth = getAuthState()

  if (!auth) {
    return null
  }

  return getSessionFromToken(auth.token)
}

export async function requireSession(): Promise<Session> {
  const auth = getAuthState()

  if (!auth) {
    consola.error(`You are not authenticated. Run \`conar login\` or set \`${CONAR_API_KEY_ENV}\`.`)
    process.exit(1)
  }

  const spinner = ora('Verifying session...').start()
  const session = await getSessionFromToken(auth.token)
  spinner.stop()

  if (!session) {
    if (auth.source === 'config') {
      clearStoredAuth()
    }

    if (auth.source === 'env') {
      consola.fail(`The \`${CONAR_API_KEY_ENV}\` value is invalid. Update it and try again.`)
      process.exit(1)
    }

    consola.fail(
      auth.method === 'api-key'
        ? `Your saved API key is no longer valid. Run \`conar login --api-key <key>\` or set \`${CONAR_API_KEY_ENV}\`.`
        : 'Your session has expired. Run `conar login` to sign in again.',
    )
    process.exit(1)
  }

  return session
}

/**
 * Best-effort sign out on the server. Always succeeds locally even if the
 * server call fails so the user is never stuck with a stale token.
 */
export async function serverSignOut(): Promise<void> {
  const auth = getAuthState()

  if (!auth || auth.source !== 'config' || auth.method !== 'session') {
    return
  }

  try {
    await fetch(`${import.meta.env.API_URL}/auth/sign-out`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth.token}` },
    })
  }
  catch {
    // ignore – we still clear local state
  }
}
