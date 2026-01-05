import { createFileRoute, redirect } from '@tanstack/react-router'
import { type } from 'arktype'
import { getSessionIsomorphic } from '~/lib/auth'
import { orpc } from '~/lib/orpc'

const searchType = type({
  'codeChallenge': 'string',
  'newUser?': 'boolean',
})

export const Route = createFileRoute('/deep/sign-in')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const { codeChallenge, newUser } = searchType.assert(Object.fromEntries(url.searchParams.entries()))

        const { data } = await getSessionIsomorphic()

        if (!data) {
          throw redirect({
            to: '/sign-in',
            search: { redirectTo: `/deep/sign-in?codeChallenge=${codeChallenge}${newUser ? '&newUser=true' : ''}` },
          })
        }

        await orpc.account.challenge.publish({ codeChallenge, newUser })

        throw redirect({ to: '/open' })
      },
    },
  },
})
