import { title } from '@tamery/shared/title'
import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'

import { centeredPageClassName } from '~/shell'

import { ConnectionsList } from './-components/connections-list'

const connectionRouteIds = [
  '/_protected/connection/$resourceId',
  '/_protected/connection/$resourceId/',
  '/_protected/connection/$resourceId/$tabId',
] as const

const DashboardPage = () => {
  const router = useRouter()

  // Connection links skip preload (it would run the resource loader's queries),
  // so without this the first open waits on the code-split route chunks.
  useEffect(() => {
    for (const id of connectionRouteIds) {
      void router.loadRouteChunk(router.routesById[id])
    }
  }, [router])

  return (
    <ScrollArea className="overflow-auto">
      <div className={centeredPageClassName}>
        <ConnectionsList />
      </div>
    </ScrollArea>
  )
}

export const Route = createFileRoute('/_protected/')({
  component: DashboardPage,
  head: () => ({
    meta: [{ title: title('Dashboard') }],
  }),
})
