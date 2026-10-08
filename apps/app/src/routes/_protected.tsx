import { cn } from '@tamery/ui/lib/utils'
import { useHotkey } from '@tanstack/react-hotkeys'
import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router'
import { PermixProvider } from 'permix/react'
import { useEffect } from 'react'

import { EventsProvider } from '~/components/events-provider'
import {
  loadPermissions,
  permix,
  usePermissionsSync,
} from '~/core/user/permissions'
import { useConnectionStringsSync } from '~/hooks/use-connection-strings-sync'
import { useLastOpenedResourcesSync } from '~/hooks/use-last-opened-resources-sync'
import { subscriptionQueryClient } from '~/lib/query-client'
import { ActionsCenter } from '~/modules/actions-center/actions-center'
import { GlobalBanner } from '~/modules/global-banner/global-banner'
import { McpHost } from '~/modules/mcp/mcp-host'
import { SubscriptionModal } from '~/modules/subscription/subscription-modal'

import { ProtectedTitleBar } from './_protected/-components/protected-titlebar'

const ProtectedLayout = () => {
  const router = useRouter()
  usePermissionsSync()
  useConnectionStringsSync()
  useLastOpenedResourcesSync()

  useHotkey('Mod+,', () => {
    if (!router.matchRoute({ to: '/settings' }, { fuzzy: true })) {
      void router.navigate({ to: '/settings' })
    }
  })

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
    <PermixProvider permix={permix}>
      <EventsProvider>
        <ActionsCenter />
        {window.electron && <McpHost />}
        <SubscriptionModal />
        <div className="flex h-full flex-col">
          <ProtectedTitleBar />
          <GlobalBanner />
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
    </PermixProvider>
  )
}

export const Route = createFileRoute('/_protected')({
  component: ProtectedLayout,
  beforeLoad: async () => {
    const { getCollections, whenOfflineReady } =
      await import('~/core/collections')
    const c = getCollections()

    await Promise.all([
      whenOfflineReady(),
      c.connectionStringsCollection.stateWhenReady(),
      c.connectionsCollection.stateWhenReady(),
      c.connectionsResourcesCollection.stateWhenReady(),
      c.workspacesCollection.stateWhenReady(),
      permix.isReady() || loadPermissions(),
    ])

    return { collections: c }
  },
})
