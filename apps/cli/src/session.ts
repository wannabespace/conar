import process from 'node:process'

import { silently } from '@tamery/shared/utils/helpers'
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

export const getSession = async (): Promise<Session | null> => {
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

    const data = (await res.json()) as Session | null

    if (!data?.user?.id) {
      return null
    }

    return data
  } catch {
    return null
  }
}

export const requireSession = async (): Promise<Session> => {
  if (!getToken()) {
    consola.error('You are not signed in. Run `tamery login` first.')
    process.exit(1)
  }

  const spinner = ora('Verifying session...').start()
  const session = await getSession()
  spinner.stop()

  if (!session) {
    clearToken()
    consola.fail(
      'Your session has expired. Run `tamery login` to sign in again.'
    )
    process.exit(1)
  }

  return session
}

export const serverSignOut = async (): Promise<void> => {
  const token = getToken()

  if (!token) {
    return
  }

  await silently(() =>
    fetch(`${import.meta.env.API_URL}/auth/sign-out`, {
      headers: { Authorization: `Bearer ${token}` },
      method: 'POST',
    })
  )
}
