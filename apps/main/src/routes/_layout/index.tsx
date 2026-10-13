import { silently } from '@tamery/shared/utils'
import { createFileRoute, redirect } from '@tanstack/react-router'

import { sessionQueryOptions } from '~/lib/auth'
import { orpc } from '~/lib/orpc'

import { HomePage } from './-home-page'

export const Route = createFileRoute('/_layout/')({
  component: HomePage,
  loader: async ({ context }) => {
    const [{ data }] = await Promise.all([
      context.queryClient.fetchQuery(sessionQueryOptions),
      silently(() =>
        context.queryClient.query({
          ...orpc.userCount.queryOptions(),
          staleTime: 'static',
        })
      ),
    ])

    if (data?.user) {
      throw redirect({ to: '/account' })
    }
  },
})
