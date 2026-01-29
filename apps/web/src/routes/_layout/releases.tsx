import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@conar/ui/components/accordion'
import { Badge } from '@conar/ui/components/badge'
import { Card, CardContent } from '@conar/ui/components/card'
import { MarkdownContent } from '@conar/ui/components/markdown-content'
import { Separator } from '@conar/ui/components/separator'
import { cn } from '@conar/ui/lib/utils'
import { createFileRoute } from '@tanstack/react-router'
import { format } from 'date-fns'
import { useState } from 'react'
import { orpc } from '~/lib/orpc'

export const Route = createFileRoute('/_layout/releases')({
  component: RouteComponent,
  loader: async () => {
    const releases = await orpc.releases()
    return { releases }
  },
})

function RouteComponent() {
  const { releases } = Route.useLoaderData()
  const [expandedReleases, setExpandedReleases] = useState<string[]>([String(releases[0]!.id)])

  return (
    <div className="mx-auto max-w-xl py-6">
      <h1 className="
        mb-6 text-2xl leading-none font-bold
        lg:text-4xl
      "
      >
        Releases
      </h1>
      <Accordion
        type="multiple"
        value={expandedReleases}
        onValueChange={setExpandedReleases}
        className="space-y-6"
      >
        {releases.map((release, index) => (
          <AccordionItem
            key={release.id}
            value={String(release.id)}
            className="border-none"
            disabled={!release.body}
          >
            <div className="mb-2">
              <AccordionTrigger
                className={cn(
                  `
                    py-0
                    hover:no-underline
                  `,
                )}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold">{release.tagName}</span>
                    {index === 0 && (
                      <Badge variant="secondary">
                        Latest
                      </Badge>
                    )}
                  </div>
                  {release.publishedAt && (
                    <p className="text-sm text-muted-foreground">
                      Released on
                      {' '}
                      {format(new Date(release.publishedAt), 'MMMM dd, yyyy')}
                    </p>
                  )}
                </div>
              </AccordionTrigger>
            </div>
            {release.body && (
              <AccordionContent>
                <Card>
                  <CardContent className="p-4">
                    <MarkdownContent
                      trustedContent
                      className="text-sm"
                      components={{
                        h2: ({ children }) => (
                          <h2 className="
                            mb-2 text-2xl font-semibold
                            not-first:mt-6
                          "
                          >
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="
                            mb-2 text-xl font-semibold
                            not-first:mt-6
                          "
                          >
                            {children}
                          </h3>
                        ),
                        ul: ({ children }) => <ul className="list-disc pl-4">{children}</ul>,
                      }}
                    >
                      {release.body || ''}
                    </MarkdownContent>
                  </CardContent>
                </Card>
              </AccordionContent>
            )}
            {index < releases.length - 1 && (
              <Separator className="mt-6" />
            )}
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
