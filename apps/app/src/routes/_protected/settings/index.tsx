import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/settings/')({
  beforeLoad: () => {
    throw redirect({ replace: true, to: '/settings/general' })
  },
})
