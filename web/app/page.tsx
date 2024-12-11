'use client'

import { useSession } from '~/hooks/use-session'

export default function Page() {
  const { data } = useSession()

  return (
    <div>
      {data?.user.email || 'No user'}
    </div>
  )
}
