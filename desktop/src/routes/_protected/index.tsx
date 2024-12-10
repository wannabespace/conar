import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/')({
  beforeLoad: async () => {
    throw redirect({
      to: '/dashboard',
    })
  },
})
