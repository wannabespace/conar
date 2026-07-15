import { createFileRoute } from '@tanstack/react-router'

import { SEO } from '~/constants'
import { seo } from '~/utils/seo'

import { HomePage } from './-home-page'

export const Route = createFileRoute('/_layout/home')({
  component: HomePage,
  // `/home` mirrors the landing page; canonical points to `/` to avoid duplicate content.
  head: () =>
    seo({
      title: `Tamery - ${SEO.title}`,
      description: SEO.description,
      image: '/og-image.png',
      path: '/',
    }),
})
