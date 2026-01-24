import { ScrollArea, ScrollBar, ScrollViewport } from '@conar/ui/components/scroll-area'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { Sidebar } from './definitions/-components/sidebar'

export const Route = createFileRoute(
  '/_protected/database/$id/definitions',
)({
  component: DefinitionsSideTabsLayout,
  beforeLoad: ({ location, params }) => {
    if (location.pathname.endsWith('/definitions') || location.pathname.endsWith('/definitions/')) {
      throw redirect({
        to: '/database/$id/definitions/indexes',
        params: { id: params.id },
        replace: true,
      })
    }
  },
})

function DefinitionsSideTabsLayout() {
  const { id } = Route.useParams()
  const { connection } = Route.useRouteContext()

  return (
    <div className="flex size-full gap-1">
      <Sidebar connection={connection} id={id} />
      <ScrollArea className="h-full flex-1 rounded-lg border bg-background">
        <ScrollViewport className="
          mx-auto flex min-h-full max-w-3xl flex-col px-4 py-6
        "
        >
          <Outlet />
          <ScrollBar />
        </ScrollViewport>
      </ScrollArea>
    </div>
  )
}
