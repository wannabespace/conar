import { responseVariants } from '@tamery/ui/components/response.utils'
import { use } from 'react'

import type { DocsPage } from '~/lib/source'

import { mdxComponents } from './mdx-components'
import { Navbar } from './navbar'
import { PageNeighbours } from './page-neighbours'
import { Sidebar } from './sidebar'
import { TocList } from './toc-list'

export const DocsScreen = ({ page }: { page: DocsPage }) => {
  const { toc } = use(page.data.load())
  const Content = page.data.body

  return (
    <div className="bg-body flex min-h-dvh flex-col">
      <Navbar />
      <div className="mx-auto flex w-full max-w-7xl flex-1">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-14 max-h-[calc(100dvh-3.5rem)] overflow-auto">
            <Sidebar />
          </div>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-10 sm:px-8">
          <article className="mx-auto w-full max-w-3xl">
            <header className="mb-8 flex flex-col gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-balance">
                {page.data.title}
              </h1>
              {page.data.description && (
                <p className="text-muted-foreground text-base">
                  {page.data.description}
                </p>
              )}
            </header>
            {toc.length > 0 && (
              <details className="border-border mb-8 border-b pb-4 xl:hidden">
                <summary className="cursor-default text-sm font-medium">
                  On this page
                </summary>
                <div className="pt-3">
                  <TocList items={toc} />
                </div>
              </details>
            )}
            <div className={responseVariants({ variant: 'document' })}>
              <Content components={mdxComponents} />
            </div>
            <PageNeighbours href={page.url} />
          </article>
        </main>
        <aside className="hidden w-48 shrink-0 pr-4 xl:block">
          {toc.length > 0 && (
            <nav
              aria-label="On this page"
              className="sticky top-14 flex max-h-[calc(100dvh-3.5rem)] flex-col gap-3 overflow-auto py-10"
            >
              <p className="text-muted-foreground text-xs font-medium">
                On this page
              </p>
              <TocList items={toc} />
            </nav>
          )}
        </aside>
      </div>
    </div>
  )
}
