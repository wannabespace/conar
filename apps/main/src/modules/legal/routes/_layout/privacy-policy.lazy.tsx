import { createLazyFileRoute } from '@tanstack/react-router'

import privacyPolicyContent from '../../content/privacy-policy.md?raw'
import { LegalDocument } from '../../legal-document'

const PrivacyPolicy = () => (
  <LegalDocument
    title="Privacy Policy"
    updatedAt="July 1, 2025"
    content={privacyPolicyContent}
  />
)

export const Route = createLazyFileRoute('/_layout/privacy-policy')({
  component: PrivacyPolicy,
})
