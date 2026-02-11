import type { RefObject } from 'react'
import { ScrollArea, ScrollBar, ScrollViewport } from '@conar/ui/components/scroll-area'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { createContext, use, useRef } from 'react'
import { Sidebar } from './definitions/-components/sidebar'

export const Route = createFileRoute(
  '/_protected/database/$id/definitions',
)({
  component: DefinitionsLayout,
  beforeLoad: ({ location, params }) => {
    if (location.pathname.endsWith('/definitions') || location.pathname.endsWith('/definitions/')) {
      throw redirect({
        to: '/database/$id/definitions/enums',
        params: { id: params.id },
        replace: true,
      })
    }
  },
})

const DefinitionsScrollContext = createContext<RefObject<HTMLDivElement | null> | null>(null)

export function useDefinitionsScroll() {
  const scrollCtx = use(DefinitionsScrollContext)

  if (!scrollCtx) {
    throw new Error('DefinitionsScrollContext not found')
  }

  return scrollCtx
}

function DefinitionsLayout() {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div className="flex size-full gap-1">
      <Sidebar />
      <ScrollArea className="h-full flex-1 rounded-lg border bg-background">
        <ScrollViewport ref={scrollRef}>
          <div className="mx-auto flex max-w-3xl flex-col px-4 py-6">
            <DefinitionsScrollContext.Provider value={scrollRef}>
              <Outlet />
            </DefinitionsScrollContext.Provider>
          </div>
        </ScrollViewport>
        <ScrollBar />
      </ScrollArea>
    </div>
  )
}
