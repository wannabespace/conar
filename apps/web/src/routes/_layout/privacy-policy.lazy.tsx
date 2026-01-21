import { createLazyFileRoute } from '@tanstack/react-router'
import ReactMarkdown from 'react-markdown'
import privacyPolicyContent from '~/content/privacy-policy.md?raw'

export const Route = createLazyFileRoute('/_layout/privacy-policy')({
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
        <h1 className="
          text-2xl leading-none font-bold mb-6
          lg:text-4xl
        "
        >
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground">Last updated: July 1st, 2025</p>
        <ReactMarkdown>{privacyPolicyContent}</ReactMarkdown>
      </div>
    </div>
  )
}
