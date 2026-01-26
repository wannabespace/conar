import { ScrollArea, ScrollBar, ScrollViewport } from '@conar/ui/components/scroll-area'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
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

function DefinitionsLayout() {
  return (
    <div className="flex size-full gap-1">
      <Sidebar />
      <ScrollArea className="h-full flex-1 rounded-lg border bg-background">
        <ScrollViewport>
          <div className="mx-auto flex max-w-3xl flex-col px-4 py-6">
            <Outlet />
          </div>
        </ScrollViewport>
        <ScrollBar />
      </ScrollArea>
    </div>
  )
}
