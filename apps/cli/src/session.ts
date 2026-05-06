import process from 'node:process'
import { consola } from 'consola'
import ora from 'ora'
import { clearToken, getToken } from '~/config'

export interface Session {
  user: {
    id: string
    email: string
    name?: string | null
  }
}

export async function getSession(): Promise<Session | null> {
  const token = getToken()

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

export async function requireSession(): Promise<Session> {
  if (!getToken()) {
    consola.error('You are not signed in. Run `conar login` first.')
    process.exit(1)
  }

  const spinner = ora('Verifying session...').start()
  const session = await getSession()
  spinner.stop()

  if (!session) {
    clearToken()
    consola.fail('Your session has expired. Run `conar login` to sign in again.')
    process.exit(1)
  }

  return session
}

/**
 * Best-effort sign out on the server. Always succeeds locally even if the
 * server call fails so the user is never stuck with a stale token.
 */
export async function serverSignOut(): Promise<void> {
  const token = getToken()

  if (!token) {
    return
  }

  try {
    await fetch(`${import.meta.env.API_URL}/auth/sign-out`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  }
  catch {
    // ignore – we still clear local state
  }
}
