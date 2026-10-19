import { responseVariants } from '@tamery/ui/components/response.utils'
import type { TOCItemType } from 'fumadocs-core/toc'
import type { ReactNode } from 'react'

import type { DocsLink } from '~/lib/nav'
import type { DocsPageData } from '~/lib/page'

import { DocsLink as PageLink } from './docs-link'
import { Navbar } from './navbar'
import { Sidebar } from './sidebar'
import { Toc } from './toc'

const Neighbour = ({
  align,
  label,
  page,
}: {
  align: 'end' | 'start'
  label: string
  page: DocsLink | null
}) => {
  if (!page) {
    return <span />
  }

  return (
    <PageLink
      className={
        align === 'end'
          ? 'text-foreground flex flex-col items-end gap-1'
          : 'text-foreground flex flex-col gap-1'
      }
      href={page.href}
    >
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-sm font-medium">{page.title}</span>
    </PageLink>
  )
}

export const DocsShell = ({
  children,
  data,
  toc,
}: {
  children: ReactNode
  data: DocsPageData
  toc: TOCItemType[]
}) => (
  <div className="bg-body flex min-h-dvh flex-col">
    <Navbar nav={data.nav} />
    <div className="mx-auto flex w-full max-w-7xl flex-1">
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-14 max-h-[calc(100dvh-3.5rem)] overflow-auto">
          <Sidebar nav={data.nav} />
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-10 sm:px-8">
        <article className="mx-auto w-full max-w-3xl">
          <header className="mb-8 flex flex-col gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-balance">
              {data.title}
            </h1>
            {data.description && (
              <p className="text-muted-foreground text-base">
                {data.description}
              </p>
            )}
          </header>
          <Toc items={toc} variant="inline" />
          <div className={responseVariants({ variant: 'document' })}>
            {children}
          </div>
          {(data.previous || data.next) && (
            <nav className="border-border mt-12 grid grid-cols-2 gap-4 border-t pt-6">
              <Neighbour align="start" label="Previous" page={data.previous} />
              <Neighbour align="end" label="Next" page={data.next} />
            </nav>
          )}
        </article>
      </main>
      <aside className="hidden w-48 shrink-0 pr-4 xl:block">
        <div className="sticky top-14 max-h-[calc(100dvh-3.5rem)] overflow-auto py-10">
          <Toc items={toc} variant="rail" />
        </div>
      </aside>
    </div>
  </div>
)
