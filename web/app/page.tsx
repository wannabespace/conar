'use client'

import { authClient } from '@/lib/client'

export default function Page() {
  const { data } = authClient.useSession()

  return (
    <div>
      {data?.user.email || 'No user'}
    </div>
  )
}
