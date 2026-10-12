import { createFileRoute, redirect } from '@tanstack/react-router'

import { authClient } from '~/lib/auth'
import { orpc } from '~/lib/orpc'

import { HomePage } from './-home-page'

export const Route = createFileRoute('/_layout/')({
  component: HomePage,
  loader: async ({ context }) => {
    const [{ data }] = await Promise.all([
      authClient.getSession(),
      context.queryClient.query({
        ...orpc.userCount.queryOptions(),
        staleTime: 'static',
      }),
    ])

    if (data?.user) {
      throw redirect({ to: '/account' })
    }
  },
})
