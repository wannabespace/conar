import { createFileRoute, redirect } from '@tanstack/react-router'

import { settingsSections } from '~/core/settings/sections'

export const Route = createFileRoute('/_protected/settings/')({
  loader: () => {
    const [first] = settingsSections
    if (first) {
      throw redirect({
        params: { section: first.slug },
        replace: true,
        to: '/settings/$section',
      })
    }
  },
})
