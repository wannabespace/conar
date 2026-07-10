import { createFileRoute } from '@tanstack/react-router'

import { seo } from '~/utils/seo'

export const Route = createFileRoute('/_layout/privacy-policy')({
  head: () =>
    seo({
      title: 'Privacy Policy - Conar',
      description: 'Learn how Conar collects, uses, and protects your personal information. Read our privacy policy.',
      path: '/privacy-policy',
    }),
})
