import { title } from '@tamery/shared/utils/title'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@tamery/ui/components/resizable'
import {
  createFileRoute,
  getRouteApi,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { useEffect } from 'react'
import { useDefaultLayout } from 'react-resizable-panels'
import { useSubscription } from 'seitu/react'

import { QueryLogger } from '~/entities/connection/components'
import { getConnectionResourceStore } from '~/entities/connection/store'
import { prefetchConnectionResourceCore } from '~/entities/connection/utils'
import { useFetchingConfig } from '~/entities/connection/utils/fetching'
import { lastOpenedResourcesStorageValue } from '~/entities/connection/utils/last-opened-resources'
import { getActiveWorkspace } from '~/entities/workspace/utils'

import { ChatPanel } from './$resourceId/-components/chat/chat-panel'
import { Navigator } from './$resourceId/-components/navigator/navigator'
import { TabBar } from './$resourceId/-components/tab-bar'
import { PasswordForm } from './-components/password-form'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const ResourcePage = () => {
  const { connection, connectionResource } = useRouteContext()
  const store = getConnectionResourceStore(connectionResource.id)
  const loggerOpened = useSubscription(store, {
    selector: (state) => state.loggerOpened,
  })
  useEffect(() => {
    const last = lastOpenedResourcesStorageValue.get()
    if (!last.includes(connectionResource.id)) {
      lastOpenedResourcesStorageValue.set(
        [
          connectionResource.id,
          ...last.filter((resourceId) => resourceId !== connectionResource.id),
        ].slice(0, 3)
      )
    }
  }, [connectionResource.id])

  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: `database-layout-${connectionResource.id}`,
    storage: localStorage,
  })
  const { type, isPasswordStateKnown } = useFetchingConfig(connection)

  if (isPasswordStateKnown && type === 'waiting-for-password') {
    return (
      <PasswordForm
        connection={connection}
        connectionResource={connectionResource}
      />
    )
  }

  return (
    <div className="flex p-2">
      <div className="flex min-w-0 flex-1 flex-col">
        <ResizablePanelGroup
          orientation="vertical"
          className="min-h-0 flex-1"
          defaultLayout={defaultLayout}
          onLayoutChanged={onLayoutChanged}
        >
          <ResizablePanel defaultSize="70%" minSize="20%">
            <div className="flex h-full min-h-0 w-full">
              <Navigator />
              <div className="bg-background flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-lg">
                <TabBar />
                <Outlet />
              </div>
            </div>
          </ResizablePanel>
          {loggerOpened && (
            <>
              <ResizableHandle className="h-1" />
              <ResizablePanel
                defaultSize="30%"
                minSize="10%"
                maxSize="50%"
                className="bg-background overflow-auto rounded-lg"
              >
                <QueryLogger connectionResource={connectionResource} />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
      <ChatPanel />
    </div>
  )
}

export const Route = createFileRoute('/_protected/connection/$resourceId')({
  component: ResourcePage,
  beforeLoad: async ({ context, params }) => {
    const {
      connectionsCollection,
      connectionsResourcesCollection,
      workspacesCollection,
    } = context.collections

    let connectionResource = connectionsResourcesCollection.get(
      params.resourceId
    )
    let connection = connectionResource
      ? connectionsCollection.get(connectionResource.connectionId)
      : undefined

    if (!(connectionResource && connection)) {
      await Promise.all([
        connectionsResourcesCollection.utils.whenSynced(),
        connectionsCollection.utils.whenSynced(),
      ])

      connectionResource = connectionsResourcesCollection.get(params.resourceId)
      connection = connectionResource
        ? connectionsCollection.get(connectionResource.connectionId)
        : undefined
    }

    if (!(connectionResource && connection)) {
      lastOpenedResourcesStorageValue.set((prev) =>
        prev.filter((id) => id !== params.resourceId)
      )
      throw redirect({ to: '/' })
    }

    const activeWorkspace = getActiveWorkspace(workspacesCollection.toArray)

    if (activeWorkspace && connection.workspaceId !== activeWorkspace.id) {
      throw redirect({ to: '/' })
    }

    return { connection, connectionResource }
  },
  loader: ({ context }) => {
    prefetchConnectionResourceCore(context.connectionResource)

    return {
      connection: context.connection,
      connectionResource: context.connectionResource,
    }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          {
            title: title(
              loaderData.connection.name,
              loaderData.connectionResource.name
            ),
          },
        ]
      : [],
  }),
})
