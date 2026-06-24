import { createFileRoute } from '@tanstack/react-router'
import { SEO } from '~/constants'
import { seo } from '~/utils/seo'
import { HomePage } from './-home-page'

export const Route = createFileRoute('/_layout/home')({
  component: HomePage,
  head: () => ({
    meta: seo({
      title: `Conar - ${SEO.title}`,
      description: SEO.description,
      image: '/og-image.png',
      url: 'https://conar.app',
    }),
  }),
})
