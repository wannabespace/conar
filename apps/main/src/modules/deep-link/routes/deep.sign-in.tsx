import { createFileRoute, redirect } from '@tanstack/react-router'
import { type } from 'arktype'

import { orpc } from '~/lib/orpc'

export const Route = createFileRoute('/deep/sign-in')({
  validateSearch: type({
    codeChallenge: 'string',
    'newUser?': 'boolean',
    type: '"web" | "desktop" | "cli" = "desktop"',
  }),
  beforeLoad: async ({ context, search }) => {
    const { codeChallenge, newUser } = search

    if (context.session) {
      await orpc.account.challenge.publish.call({ codeChallenge, newUser })

      throw redirect({ to: '/open', search: { type: search.type } })
    }

    throw redirect({
      to: '/sign-in',
      search: {
        redirectPath: `/deep/sign-in?codeChallenge=${codeChallenge}&type=${search.type}`,
      },
    })
  },
})
