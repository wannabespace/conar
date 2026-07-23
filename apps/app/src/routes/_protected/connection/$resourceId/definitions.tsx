import { title } from '@tamery/shared/utils/title'
import { ScrollArea } from '@tamery/ui/components/scroll-area'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { Sidebar } from './definitions/-components/sidebar'

export const Route = createFileRoute('/_protected/connection/$resourceId/definitions')({
  component: DefinitionsLayout,
  beforeLoad: ({ location, params }) => {
    if (location.pathname.endsWith('/definitions') || location.pathname.endsWith('/definitions/')) {
      throw redirect({
        to: '/connection/$resourceId/definitions/enums',
        params: { resourceId: params.resourceId },
        replace: true,
      })
    }
  },
  loader: ({ context }) => context,
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          {
            title: title(
              'Definitions',
              loaderData.connection.name,
              loaderData.connectionResource.name,
            ),
          },
        ]
      : [],
  }),
})

function DefinitionsLayout() {
  return (
    <div className="flex size-full min-h-0 gap-2">
      <Sidebar />
      <div
        className={`
          flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl border
          bg-background shadow-lg
        `}
      >
        <ScrollArea className="h-full flex-1">
          <div className="mx-auto flex w-full max-w-3xl flex-col px-6 py-5">
            <Outlet />
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
