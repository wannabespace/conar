import { createFileRoute, redirect } from '@tanstack/react-router'
import { getSessionIsomorphic } from '~/lib/auth'
import { HomePage } from './home'

export const Route = createFileRoute('/_layout/')({
  component: HomePage,
  loader: async () => {
    const { data } = await getSessionIsomorphic()

    if (data?.user) {
      throw redirect({ to: '/account' })
    }
  },
})
