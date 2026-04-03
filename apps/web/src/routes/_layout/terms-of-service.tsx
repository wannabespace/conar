import { createFileRoute } from '@tanstack/react-router'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/_layout/terms-of-service')({
  head: () => ({
    meta: seo({
      title: 'Terms of Service - Conar',
      description: 'Read the terms and conditions for using Conar. Our terms of service outline your rights and responsibilities.',
      url: 'https://conar.app/terms-of-service',
    }),
  }),
})
