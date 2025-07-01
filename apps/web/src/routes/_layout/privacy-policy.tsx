import { createFileRoute } from '@tanstack/react-router'
import ReactMarkdown from 'react-markdown'
import privacyPolicyContent from '~/content/privacy-policy.md?raw'

export const Route = createFileRoute('/_layout/privacy-policy')({
  component: PrivacyPolicy,
})

function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-20 max-w-3xl">
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <h1 className="text-5xl font-bold leading-0">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: July 1st, 2025</p>
        <ReactMarkdown>{privacyPolicyContent}</ReactMarkdown>
      </div>
    </div>
  )
}
