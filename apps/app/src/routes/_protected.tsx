import { cn } from '@tamery/ui/lib/utils'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'

import { GlobalBanner } from '~/components/global-banner'
import { SubscriptionModal } from '~/components/subscriprion-modal'
import { cleanCollections, getCollections } from '~/entities/collections'
import { EventsProvider } from '~/events'
import { enterAppAnimation } from '~/global-hooks'
import { useConnectionStringsSync } from '~/hooks/use-connection-strings-sync'
import { subscriptionQueryClient } from '~/main'

import { ActionsCenter } from './-components/actions-center'
import { AppTitleBar } from './_protected/-components/app-titlebar'

export const Route = createFileRoute('/_protected')({
  component: ProtectedLayout,
  beforeLoad: async () => {
    const c = getCollections()

    await Promise.all([
      c.connectionStringsCollection.stateWhenReady(),
      c.connectionsCollection.stateWhenReady(),
      c.connectionsResourcesCollection.stateWhenReady(),
    ])

    return { collections: c }
  },
})

function ProtectedLayout() {
  useConnectionStringsSync()

  useEffect(() => {
    return () => {
      cleanCollections()
    }
  }, [])

  useEffect(() => {
    enterAppAnimation()
  }, [])

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
      <SubscriptionModal />
      <ActionsCenter />
      <div className="flex h-full flex-col">
        <AppTitleBar />
        <GlobalBanner />
        <div
          className={cn(
            'min-h-0 flex-1',
            // Let route pages fill the area below the title bar, matching the
            // full-height behavior the root layout provides to its last child.
            '*:last:h-full *:last:min-h-[inherit] *:last:flex-1',
          )}
        >
          <Outlet />
        </div>
      </div>
    </EventsProvider>
  )
}
