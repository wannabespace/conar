'use client'

import { useSession } from '~/hooks/use-session'

export default function Page() {
  const { session } = useSession()

  return (
    <div>
      {session?.user.email || 'No user'}
    </div>
  )
}
