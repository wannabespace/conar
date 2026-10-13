import { createFileRoute } from '@tanstack/react-router'

import { seo } from '~/utils/seo'

import privacyPolicyContent from '../../content/privacy-policy.md?raw'
import { LegalDocument } from '../../legal-document'

const PrivacyPolicy = () => (
  <LegalDocument
    title="Privacy Policy"
    updatedAt="July 1, 2025"
    content={privacyPolicyContent}
  />
)

export const Route = createFileRoute('/_layout/privacy-policy')({
  component: PrivacyPolicy,
  head: () =>
    seo({
      title: 'Privacy Policy - Tamery',
      description:
        'Learn how Tamery collects, uses, and protects your personal information. Read our privacy policy.',
      path: '/privacy-policy',
    }),
})
