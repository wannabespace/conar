import { createFileRoute } from '@tanstack/react-router'

import { seo } from '~/utils/seo'

export const Route = createFileRoute('/_layout/terms-of-service')({
  head: () =>
    seo({
      title: 'Terms of Service - Conar',
      description: 'Read the terms and conditions for using Conar. Our terms of service outline your rights and responsibilities.',
      path: '/terms-of-service',
    }),
})
