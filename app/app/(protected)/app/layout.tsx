'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useSession } from '~/hooks/use-session'
import { authClient } from '~/lib/auth'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, data, refetch } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!data && !isLoading) {
      router.push('/sign-in')
    }
  }, [data, isLoading])

  return (
    <>
      <div className="flex gap-2 p-2">
        <Link href="/app" className="[&.active]:font-bold">
          Dashboard
        </Link>
      </div>
      <hr />
      <header>
        {isLoading ? 'Loading...' : data?.user.email || 'No user'}
      </header>
      <button
        onClick={async () => {
          await authClient.signOut()
          await refetch()
        }}
      >
        Sign Out
      </button>
      {children}
    </>
  )
}
