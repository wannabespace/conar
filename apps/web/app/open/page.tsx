'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { authClient } from '~/lib/client'

export default function OpenPage() {
  const searchParams = useSearchParams()
  const { data, isPending } = authClient.useSession()

  useEffect(() => {
    if (isPending)
      return

    if (data) {
      const key = searchParams.get('get')

      location.assign(`connnect://session?key=${key}&token=${data.session.token}`)
    }
  }, [isPending])

  return <div>Loading</div>
}
