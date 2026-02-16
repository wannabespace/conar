import type { RefObject } from 'react'
import { ScrollArea, ScrollBar, ScrollViewport } from '@conar/ui/components/scroll-area'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { createContext, use, useEffect, useRef, useState } from 'react'
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

interface DefinitionsScrollContextValue {
  scrollRef: RefObject<HTMLDivElement | null>
  isScrollReady: boolean
}

const DefinitionsScrollContext = createContext<DefinitionsScrollContextValue | null>(null)

export function useDefinitionsScroll() {
  const scrollCtx = use(DefinitionsScrollContext)

  if (!scrollCtx) {
    throw new Error('DefinitionsScrollContext not found')
  }

  return scrollCtx
}

function DefinitionsLayout() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isScrollReady, setIsScrollReady] = useState(false)

  useEffect(() => {
    if (scrollRef.current) {
      setIsScrollReady(true)
    }
  }, [])

  return (
    <div className="flex size-full gap-1">
      <Sidebar />
      <ScrollArea className="h-full flex-1 rounded-lg border bg-background">
        <ScrollViewport ref={scrollRef}>
          <div className="mx-auto flex max-w-3xl flex-col px-4 py-6">
            <DefinitionsScrollContext.Provider value={{ scrollRef, isScrollReady }}>
              <Outlet />
            </DefinitionsScrollContext.Provider>
          </div>
        </ScrollViewport>
        <ScrollBar />
      </ScrollArea>
    </div>
  )
}
