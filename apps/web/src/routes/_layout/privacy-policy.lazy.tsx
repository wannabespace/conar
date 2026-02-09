import { MarkdownContent } from '@conar/ui/components/markdown-content'
import { createLazyFileRoute } from '@tanstack/react-router'
import privacyPolicyContent from '~/content/privacy-policy.md?raw'

export const Route = createLazyFileRoute('/_layout/privacy-policy')({
  component: PrivacyPolicy,
})

function PrivacyPolicy() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-20">
      <div className="prose max-w-none prose-gray dark:prose-invert">
        <h1 className="mb-6 text-2xl font-bold leading-none lg:text-4xl">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground">Last updated: July 1st, 2025</p>
        <MarkdownContent trustedContent>{privacyPolicyContent}</MarkdownContent>
      </div>
    </div>
  )
}
