import { createFileRoute } from '@tanstack/react-router'
import ReactMarkdown from 'react-markdown'
import termsOfServiceContent from '~/content/terms-of-service.md?raw'

export const Route = createFileRoute('/_layout/terms-of-service')({
  component: TermsOfService,
})

function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-20 max-w-3xl">
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <h1 className="text-5xl font-bold leading-0">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: July 1st, 2025</p>
        <ReactMarkdown>{termsOfServiceContent}</ReactMarkdown>
      </div>
    </div>
  )
}
