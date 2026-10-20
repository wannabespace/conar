import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ href: import.meta.env.VITE_PUBLIC_MAIN_URL })
  },
})
