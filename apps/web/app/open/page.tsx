'use client'

import { use, useEffect } from 'react'
import { authClient } from '~/lib/client'

export default function OpenPage({ searchParams }: { searchParams: Promise<{ key: string }> }) {
  const { key } = use(searchParams)
  const { data, isPending } = authClient.useSession()

  useEffect(() => {
    if (isPending)
      return

    if (data && key) {
      location.assign(`connnect://session?key=${key}&token=${data.session.token}`)
    }
  }, [isPending, key])

  return <div>Loading</div>
}
