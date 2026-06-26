import { createFileRoute } from '@tanstack/react-router'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/_layout/privacy-policy')({
  head: () => ({
    meta: seo({
      title: 'Privacy Policy - Tamery',
      description: 'Learn how Tamery collects, uses, and protects your personal information. Read our privacy policy.',
      url: 'https://tamery.app/privacy-policy',
    }),
  }),
})
