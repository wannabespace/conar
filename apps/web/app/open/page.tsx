'use client'

import { use, useEffect } from 'react'
import { authClient } from '~/lib/client'

export default function OpenPage({ searchParams }: { searchParams: Promise<Partial<{ 'code-challenge': string, 'newUser': string }>> }) {
  const { 'code-challenge': codeChallenge, newUser } = use(searchParams)
  const { data, isPending } = authClient.useSession()

  function handleOpenSession(codeChallenge: string) {
    if (!data)
      return

    location.assign(`connnect://session?code-challenge=${codeChallenge}&token=${data.session.token}${newUser ? '&newUser=true' : ''}`)
  }

  useEffect(() => {
    if (isPending)
      return

    if (codeChallenge) {
      handleOpenSession(codeChallenge)
    }
  }, [isPending, codeChallenge])

  return <div>Loading</div>
}
