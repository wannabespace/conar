import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@tamery/ui/components/accordion'
import { Badge } from '@tamery/ui/components/badge'
import { Card, CardContent } from '@tamery/ui/components/card'
import { Separator } from '@tamery/ui/components/separator'
import { cn } from '@tamery/ui/lib/utils'
import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { format } from 'date-fns'
import type { ComponentPropsWithoutRef } from 'react'
import { useState } from 'react'
import { Streamdown } from 'streamdown'

import { orpc } from '~/lib/orpc'
import { seo } from '~/utils/seo'

const routeApi = getRouteApi('/_layout/releases')

const ReleaseMarkdownH2 = ({ children }: ComponentPropsWithoutRef<'h2'>) => (
  <h2 className="mb-2 text-2xl font-semibold not-first:mt-6">{children}</h2>
)

const ReleaseMarkdownH3 = ({ children }: ComponentPropsWithoutRef<'h3'>) => (
  <h3 className="mb-2 text-xl font-semibold not-first:mt-6">{children}</h3>
)

const ReleaseMarkdownUl = ({ children }: ComponentPropsWithoutRef<'ul'>) => (
  <ul className="list-disc pl-4">{children}</ul>
)

const releaseMarkdownComponents = {
  h2: ReleaseMarkdownH2,
  h3: ReleaseMarkdownH3,
  ul: ReleaseMarkdownUl,
}

const RouteComponent = () => {
  const { releases } = routeApi.useLoaderData()
  const [firstRelease] = releases
  const [expandedReleases, setExpandedReleases] = useState<string[]>(
    firstRelease ? [String(firstRelease.id)] : []
  )

  return (
    <div className="mx-auto max-w-xl py-6">
      <h1 className="mb-6 text-2xl leading-none font-bold lg:text-4xl">
        Releases
      </h1>
      <Accordion
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
              <AccordionTrigger className={cn(`py-0 hover:no-underline`)}>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold">
                      {release.tagName}
                    </span>
                    {index === 0 && <Badge variant="secondary">Latest</Badge>}
                  </div>
                  {release.publishedAt && (
                    <p className="text-muted-foreground text-sm">
                      Released on{' '}
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
                    <Streamdown
                      mode="static"
                      className="text-sm"
                      linkSafety={{ enabled: false }}
                      components={releaseMarkdownComponents}
                    >
                      {release.body || ''}
                    </Streamdown>
                  </CardContent>
                </Card>
              </AccordionContent>
            )}
            {index < releases.length - 1 && <Separator className="mt-6" />}
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

export const Route = createFileRoute('/_layout/releases')({
  component: RouteComponent,
  head: () =>
    seo({
      title: 'Releases - Tamery',
      description:
        'View the latest Tamery releases, changelogs, and version history. Stay up to date with new features and improvements.',
      image: '/og-image.png',
      path: '/releases',
    }),
  loader: async () => {
    const releases = await orpc.releases.call()
    return { releases }
  },
})
