import { createFileRoute, redirect } from '@tanstack/react-router'
import { type } from 'arktype'

export const Route = createFileRoute('/deep/share')({
  validateSearch: type({
    // A path, never a URL: the redirect below always stays on the share site.
    path: /^\/(?!\/)/u,
  }),
  beforeLoad: ({ context, search: { path } }) => {
    if (context.session) {
      throw redirect({
        href: `${import.meta.env.VITE_PUBLIC_SHARE_URL}${path}`,
      })
    }

    throw redirect({
      to: '/sign-in',
      search: {
        redirectPath: `/deep/share?${new URLSearchParams({ path })}`,
      },
    })
  },
})
