import { createLazyFileRoute } from '@tanstack/react-router'
import ReactMarkdown from 'react-markdown'
import termsOfServiceContent from '~/content/terms-of-service.md?raw'

export const Route = createLazyFileRoute('/_layout/terms-of-service')({
  component: TermsOfService,
})

function TermsOfService() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-20">
      <div className={`
        prose max-w-none prose-gray
        dark:prose-invert
      `}
      >
        <h1 className="
          mb-6 text-2xl leading-none font-bold
          lg:text-4xl
        "
        >
          Terms of Service
        </h1>
        <p className="text-sm text-muted-foreground">Last updated: July 1st, 2025</p>
        <ReactMarkdown>{termsOfServiceContent}</ReactMarkdown>
      </div>
    </div>
  )
}
