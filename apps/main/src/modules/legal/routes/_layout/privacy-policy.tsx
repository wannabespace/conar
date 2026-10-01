import { createFileRoute } from '@tanstack/react-router'

import { seo } from '~/utils/seo'

export const Route = createFileRoute('/_layout/privacy-policy')({
  head: () =>
    seo({
      title: 'Privacy Policy - Tamery',
      description:
        'Learn how Tamery collects, uses, and protects your personal information. Read our privacy policy.',
      path: '/privacy-policy',
    }),
})
