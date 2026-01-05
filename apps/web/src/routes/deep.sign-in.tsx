import { createFileRoute, redirect } from '@tanstack/react-router'
import { type } from 'arktype'
import { useEffect } from 'react'
import { getSessionIsomorphic } from '~/lib/auth'
import { orpc } from '~/lib/orpc'

export const Route = createFileRoute('/deep/sign-in')({
  component: DeepSignInPage,
  validateSearch: type({
    'codeChallenge': 'string',
    'newUser?': 'boolean',
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const { data } = await getSessionIsomorphic()

    if (!data) {
      throw redirect({
        to: '/sign-in',
        search: { redirectTo: `/deep/sign-in?codeChallenge=${deps.codeChallenge}${deps.newUser ? '&newUser=true' : ''}` },
      })
    }

    await orpc.account.challenge.store(deps)

    throw redirect({ to: '/open' })
  },
})

const getUrl = (codeChallenge: string, newUser?: boolean) => `conar://session?codeChallenge=${codeChallenge}${newUser ? '&newUser=true' : ''}`

function DeepSignInPage() {
  const { codeChallenge, newUser } = Route.useSearch()

  useEffect(() => {
    location.assign(getUrl(codeChallenge, newUser))
  }, [codeChallenge, newUser])

  return (
    <div>
      123
    </div>
  )
}
