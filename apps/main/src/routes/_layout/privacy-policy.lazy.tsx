import { createLazyFileRoute } from '@tanstack/react-router'
import ReactMarkdown from 'react-markdown'

import privacyPolicyContent from '~/content/privacy-policy.md?raw'

const PrivacyPolicy = () => (
  <div className="container mx-auto max-w-3xl px-4 py-20">
    <div className="prose prose-gray dark:prose-invert max-w-none">
      <h1 className="mb-6 text-2xl leading-none font-bold lg:text-4xl">
        Privacy Policy
      </h1>
      <p className="text-muted-foreground text-sm">
        Last updated: July 1st, 2025
      </p>
      <ReactMarkdown>{privacyPolicyContent}</ReactMarkdown>
    </div>
  </div>
)

export const Route = createLazyFileRoute('/_layout/privacy-policy')({
  component: PrivacyPolicy,
})
