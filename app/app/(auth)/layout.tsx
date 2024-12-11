'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AppLogo } from '~/components/app-logo'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { useSession } from '~/hooks/use-session'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push('/')
    }
  }, [session])

  return (
    <div className="flex min-h-screen py-10">
      <Card className="m-auto w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex flex-col items-center gap-5">
            <AppLogo className="size-16" />
            <h1 className="text-2xl font-semibold">Login to Connnect</h1>
          </CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  )
}
