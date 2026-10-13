import { silently } from '@tamery/shared/utils'
import { createFileRoute, redirect } from '@tanstack/react-router'

import { orpc } from '~/lib/orpc'

import { HomePage } from './-home-page'

export const Route = createFileRoute('/_layout/')({
  component: HomePage,
  loader: async ({ context }) => {
    if (context.session) {
      throw redirect({ to: '/account' })
    }

    await silently(() =>
      context.queryClient.query({
        ...orpc.userCount.queryOptions(),
        staleTime: 'static',
      })
    )
  },
})
