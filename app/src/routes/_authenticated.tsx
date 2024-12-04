import { createFileRoute, redirect } from '@tanstack/react-router'
import { queryClient } from '~/main'
import { sessionQuery } from '~/query/auth'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const { data } = await queryClient.ensureQueryData(sessionQuery())

    if (!data?.session) {
      throw redirect({
        to: '/sign-in',
      })
    }
  },
})
