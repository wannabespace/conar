import { createFileRoute, redirect } from '@tanstack/react-router'
import { type } from 'arktype'
import { authClient } from '~/lib/auth'
import { orpc } from '~/lib/orpc'

export const Route = createFileRoute('/deep/sign-in')({
  validateSearch: type({
    'codeChallenge': 'string',
    'newUser?': 'boolean',
    'anonymousToken?': 'string',
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const { codeChallenge, newUser, anonymousToken } = deps
    const redirectSearch = new URLSearchParams({ codeChallenge })
    if (anonymousToken)
      redirectSearch.set('anonymousToken', anonymousToken)
    if (newUser)
      redirectSearch.set('newUser', 'true')

    const { data } = await authClient.getSession()

    if (data) {
      await orpc.account.challenge.publish({ codeChallenge, newUser, anonymousToken })

      throw redirect({ to: '/open' })
    }

    throw redirect({
      to: '/sign-in',
      search: { redirectPath: `/deep/sign-in?${redirectSearch.toString()}` },
    })
  },
})
