import { cn } from '@tamery/ui/lib/utils'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'

import { EventsProvider } from '~/components/events-provider'
import { useConnectionStringsSync } from '~/hooks/use-connection-strings-sync'
import { useLastOpenedResourcesSync } from '~/hooks/use-last-opened-resources-sync'
import { protectedModules } from '~/lib/protected-modules'
import { subscriptionQueryClient } from '~/lib/query-client'

import { ProtectedTitleBar } from './_protected/-components/protected-titlebar'

const ProtectedLayout = () => {
  useConnectionStringsSync()
  useLastOpenedResourcesSync()

  useEffect(() => {
    const handleFocus = () => {
      subscriptionQueryClient.refetchQueries()
    }

    // Native trigger don't work for some reason, so we need to use this workaround
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  return (
    <EventsProvider>
      {protectedModules.mounts.map((Mount, index) => (
        <Mount key={index} />
      ))}
      <div className="flex h-full flex-col">
        <ProtectedTitleBar />
        {protectedModules.banners.map(({ Component }, index) => (
          <Component key={index} />
        ))}
        <div
          className={cn(
            'min-h-0 flex-1',
            '*:last:h-full *:last:min-h-[inherit] *:last:flex-1'
          )}
        >
          <Outlet />
        </div>
      </div>
    </EventsProvider>
  )
}

export const Route = createFileRoute('/_protected')({
  component: ProtectedLayout,
  beforeLoad: async () => {
    const { getCollections } = await import('~/core/collections')
    const c = getCollections()

    await Promise.all([
      c.connectionStringsCollection.stateWhenReady(),
      c.connectionsCollection.stateWhenReady(),
      c.connectionsResourcesCollection.stateWhenReady(),
      c.workspacesCollection.stateWhenReady(),
    ])

    return { collections: c }
  },
})
