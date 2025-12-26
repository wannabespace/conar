import { createFileRoute } from '@tanstack/react-router'
import ReactMarkdown from 'react-markdown'
import privacyPolicyContent from '~/content/privacy-policy.md?raw'

export const Route = createFileRoute('/_layout/privacy-policy')({
  component: PrivacyPolicy,
})

function PrivacyPolicy() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-20">
      <div className={`
        prose max-w-none prose-gray
        dark:prose-invert
      `}
      >
        <h1 className="text-5xl leading-0 font-bold">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: July 1st, 2025</p>
        <ReactMarkdown>{privacyPolicyContent}</ReactMarkdown>
      </div>
    </div>
  )
}
