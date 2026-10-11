import { Response } from '@tamery/ui/components/response'

export const LegalDocument = ({
  content,
  title,
  updatedAt,
}: {
  content: string
  title: string
  updatedAt: string
}) => (
  <main className="mx-auto w-full max-w-3xl px-4 pt-16 sm:px-6 sm:pt-24">
    <header className="mb-12 flex flex-col gap-3">
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h1>
      <p className="text-muted-foreground text-sm">Last updated {updatedAt}</p>
    </header>
    <Response variant="document" mode="static">
      {content}
    </Response>
  </main>
)
