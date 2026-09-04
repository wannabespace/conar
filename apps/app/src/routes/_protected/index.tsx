import { title } from '@tamery/shared/utils/title'
import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import { createFileRoute } from '@tanstack/react-router'

import { centeredPageClassName } from '~/shell'

import { ConnectionsList } from './-components/connections-list'

const DashboardPage = () => (
  <ScrollArea className="overflow-auto">
    <div className={centeredPageClassName}>
      <ConnectionsList />
    </div>
  </ScrollArea>
)

export const Route = createFileRoute('/_protected/')({
  component: DashboardPage,
  head: () => ({
    meta: [{ title: title('Dashboard') }],
  }),
})
