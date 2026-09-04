import { title } from '@tamery/shared/utils/title'
import {
  createFileRoute,
  getRouteApi,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { lazy, Suspense, useEffect } from 'react'
import { useSubscription } from 'seitu/react'

import { QueryLoggerSkeleton } from '~/entities/connection/components/query-logger-skeleton'
import type { ConnectionResource } from '~/entities/connection/core'
import { getConnectionResourceStore } from '~/entities/connection/store'
import { prefetchConnectionResourceCore } from '~/entities/connection/utils'
import { useFetchingConfig } from '~/entities/connection/utils/fetching'
import { lastOpenedResourcesStorageValue } from '~/entities/connection/utils/last-opened-resources'
import { workspaceSelection } from '~/entities/workspace/utils'
import { LOGGER_DEFAULT_HEIGHT } from '~/lib/constants'
import { resourcePanelClassName } from '~/shell'

import { ChatPanel } from './$resourceId/-components/chat/chat-panel'
import { Navigator } from './$resourceId/-components/navigator/navigator'
import { TabBar } from './$resourceId/-components/tab-bar'
import { PasswordForm } from './-components/password-form'

const QueryLogger = lazy(async () => {
  const { QueryLogger: component } =
    await import('~/entities/connection/components/query-logger')

  return { default: component }
})

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const QueryLoggerPanel = ({
  connectionResource,
  opened,
}: {
  connectionResource: ConnectionResource
  opened: boolean
}) => {
  if (!opened) {
    return null
  }

  return (
    <div
      className="flex shrink-0 flex-col pt-1.5"
      style={{ height: LOGGER_DEFAULT_HEIGHT }}
    >
      <div className={resourcePanelClassName}>
        <Suspense fallback={<QueryLoggerSkeleton />}>
          <QueryLogger connectionResource={connectionResource} />
        </Suspense>
      </div>
    </div>
  )
}

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

  const { type } = useFetchingConfig(connection)

  if (type === 'waiting-for-password') {
    return (
      <PasswordForm
        connection={connection}
        connectionResource={connectionResource}
      />
    )
  }

  return (
    <div className="flex size-full p-2">
      <Navigator />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className={resourcePanelClassName}>
          <TabBar />
          <Outlet />
        </div>
        <QueryLoggerPanel
          connectionResource={connectionResource}
          opened={loggerOpened}
        />
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

    const activeWorkspace = workspaceSelection.current(
      workspacesCollection.toArray
    )

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
