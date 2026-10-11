import { createLazyFileRoute } from '@tanstack/react-router'

import termsOfServiceContent from '../../content/terms-of-service.md?raw'
import { LegalDocument } from '../../legal-document'

const TermsOfService = () => (
  <LegalDocument
    title="Terms of Service"
    updatedAt="July 1, 2025"
    content={termsOfServiceContent}
  />
)

export const Route = createLazyFileRoute('/_layout/terms-of-service')({
  component: TermsOfService,
})
