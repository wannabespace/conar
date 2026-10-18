import { createFileRoute } from '@tanstack/react-router'

import { homeHead } from './-home-head'
import { HomePage } from './-home-page'

export const Route = createFileRoute('/_layout/home')({
  component: HomePage,
  // `/home` mirrors the landing page; canonical points to `/` to avoid duplicate content.
  head: homeHead,
})
