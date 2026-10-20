import { responseVariants } from '@tamery/ui/components/response.utils'
import { AnchorProvider } from 'fumadocs-core/toc'
import { use } from 'react'

import type { DocsPage } from '~/lib/source'

import { mdxComponents } from './mdx-components'
import { Navbar } from './navbar'
import { PageNeighbours } from './page-neighbours'
import { Sidebar } from './sidebar'
import { TocBar, TocRail } from './toc'

const DocsArticle = ({ page }: { page: DocsPage }) => {
  const { toc } = use(page.data.load())
  const Content = page.data.body

  return (
    <AnchorProvider single toc={toc}>
      {toc.length > 0 && <TocBar items={toc} />}
      <div className="mx-auto flex w-full max-w-6xl justify-center gap-12 px-5 @xl:px-10">
        <article className="max-w-3xl min-w-0 flex-1 py-10 @xl:py-14">
          <header className="mb-10 flex flex-col gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-balance">
              {page.data.title}
            </h1>
            {page.data.description && (
              <p className="text-muted-foreground text-lg text-pretty">
                {page.data.description}
              </p>
            )}
          </header>
          <div className={responseVariants({ variant: 'document' })}>
            <Content components={mdxComponents} />
          </div>
          <PageNeighbours href={page.url} />
        </article>
        {toc.length > 0 && (
          <aside className="hidden w-52 shrink-0 @4xl:block">
            <TocRail items={toc} />
          </aside>
        )}
      </div>
    </AnchorProvider>
  )
}

export const DocsScreen = ({ page }: { page: DocsPage }) => (
  <div className="bg-body flex min-h-dvh flex-col">
    <Navbar />
    <div className="flex flex-1 gap-2 px-2 pb-2">
      <aside className="sticky top-14 hidden max-h-[calc(100dvh-3.5rem)] w-60 shrink-0 self-start overflow-y-auto py-2 pr-1.5 pl-2 lg:block">
        <Sidebar />
      </aside>
      <main className="bg-background ring-foreground/4 @container min-w-0 flex-1 rounded-2xl ring">
        <DocsArticle key={page.url} page={page} />
      </main>
    </div>
  </div>
)
