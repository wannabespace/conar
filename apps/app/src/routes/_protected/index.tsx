import { title } from '@tamery/shared/utils/title'
import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import { createFileRoute } from '@tanstack/react-router'

import { ConnectionsList } from './-components/connections-list'

export const Route = createFileRoute('/_protected/')({
  component: DashboardPage,
  head: () => ({
    meta: [{ title: title('Dashboard') }],
  }),
})

function DashboardPage() {
  return (
    <ScrollArea className="overflow-auto">
      <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col px-6 py-12">
        <ConnectionsList />
      </div>
    </ScrollArea>
  )
}
