'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useSession } from '~/hooks/use-session'
import { authClient } from '~/lib/auth'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, session, refetch } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!session && !isLoading) {
      router.push('/sign-in')
    }
  }, [session, isLoading])

  return (
    <>
      <div className="flex gap-2 p-2">
        <Link href="/" className="[&.active]:font-bold">
          Home
        </Link>
        {' '}
        <Link href="/about" className="[&.active]:font-bold">
          About
        </Link>
        <Link href="/dashboard" className="[&.active]:font-bold">
          Dashboard
        </Link>
      </div>
      <hr />
      <header>
        {isLoading ? 'Loading...' : session?.user.email || 'No user'}
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
