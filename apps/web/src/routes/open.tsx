import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { z } from 'zod'
import { authClient } from '~/lib/auth'

export const Route = createFileRoute('/open')({
  component: RouteComponent,
  validateSearch: z.object({
    'code-challenge': z.string(),
    'newUser': z.boolean().optional(),
  }),
})

function RouteComponent() {
  const { 'code-challenge': codeChallenge, newUser } = Route.useSearch()
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
