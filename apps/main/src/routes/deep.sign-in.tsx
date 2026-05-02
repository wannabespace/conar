import { createFileRoute, redirect } from '@tanstack/react-router'
import { type } from 'arktype'
import { authClient } from '~/lib/auth'
import { orpc } from '~/lib/orpc'

export const Route = createFileRoute('/deep/sign-in')({
  validateSearch: type({
    'codeChallenge': 'string',
    'newUser?': 'boolean',
    'web': 'boolean = false',
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const { codeChallenge, newUser } = deps

    const { data } = await authClient.getSession()

    if (data) {
      await orpc.account.challenge.publish.call({ codeChallenge, newUser })

      throw redirect({ to: '/open', search: { web: deps.web } })
    }

    throw redirect({
      to: '/sign-in',
      search: { redirectPath: `/deep/sign-in?codeChallenge=${codeChallenge}&web=${deps.web}` },
    })
  },
})
