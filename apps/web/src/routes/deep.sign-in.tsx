import { createFileRoute, redirect } from '@tanstack/react-router'
import { type } from 'arktype'
import { getSessionIsomorphic } from '~/lib/auth'
import { orpc } from '~/lib/orpc'

export const Route = createFileRoute('/deep/sign-in')({
  component: () => <></>,
  validateSearch: type({
    'codeChallenge': 'string',
    'newUser?': 'boolean',
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const { codeChallenge, newUser } = deps

    const { data } = await getSessionIsomorphic()

    if (data) {
      await orpc.account.challenge.publish({ codeChallenge, newUser })

      throw redirect({ to: '/open' })
    }

    throw redirect({
      to: '/sign-in',
      search: { redirectPath: `/deep/sign-in?codeChallenge=${codeChallenge}` },
    })
  },
})
