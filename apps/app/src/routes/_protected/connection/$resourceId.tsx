import { title } from '@tamery/shared/utils/title'
import {
  ResizableGroup,
  ResizableSeparator,
  ResizablePanel,
} from '@tamery/ui/components/custom/resizable'
import {
  createFileRoute,
  getRouteApi,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { type } from 'arktype'
import { lazy, Suspense, useEffect } from 'react'
import { useSubscription } from 'seitu/react'
import { createWebStorageValue } from 'seitu/web'

import { QueryLoggerSkeleton } from '~/entities/connection/components/query-logger-skeleton'
import { getConnectionResourceStore } from '~/entities/connection/store'
import { prefetchConnectionResourceCore } from '~/entities/connection/utils'
import { useFetchingConfig } from '~/entities/connection/utils/fetching'
import { lastOpenedResourcesStorageValue } from '~/entities/connection/utils/last-opened-resources'
import { workspaceSelection } from '~/entities/workspace/utils'
import {
  CHAT_DEFAULT_WIDTH,
  CHAT_MAX_WIDTH,
  CHAT_MIN_WIDTH,
  CHAT_WIDTH_KEY,
  LOGGER_DEFAULT_HEIGHT,
  LOGGER_HEIGHT_KEY,
  LOGGER_MAX_HEIGHT,
  LOGGER_MIN_HEIGHT,
  NAVIGATOR_WIDTH_KEY,
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
} from '~/lib/constants'
import { resourcePanelClassName } from '~/shell'

import { ChatPanel } from './$resourceId/-components/chat/chat-panel'
import { navigatorOpenValue } from './$resourceId/-components/navigator/constants'
import { Navigator } from './$resourceId/-components/navigator/navigator'
import { TabBar } from './$resourceId/-components/tab-bar'
import { PasswordForm } from './-components/password-form'

const QueryLogger = lazy(async () => {
  const { QueryLogger: component } =
    await import('~/entities/connection/components/query-logger')

  return { default: component }
})

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const persistedSize = (key: string, defaultValue: number) =>
  createWebStorageValue({
    defaultValue,
    key,
    schema: type('number'),
    type: 'localStorage',
  })

const navigatorWidthValue = persistedSize(
  NAVIGATOR_WIDTH_KEY,
  SIDEBAR_DEFAULT_WIDTH
)
const chatWidthValue = persistedSize(CHAT_WIDTH_KEY, CHAT_DEFAULT_WIDTH)
const loggerHeightValue = persistedSize(
  LOGGER_HEIGHT_KEY,
  LOGGER_DEFAULT_HEIGHT
)

const ResourcePage = () => {
  const { connection, connectionResource } = useRouteContext()
  const store = getConnectionResourceStore(connectionResource.id)
  const loggerOpened = useSubscription(store, {
    selector: (state) => state.loggerOpened,
  })
  const chatOpened = useSubscription(store, {
    selector: (state) => state.chatOpened,
  })
  const navigatorOpened = useSubscription(navigatorOpenValue)
  const navigatorWidth = useSubscription(navigatorWidthValue)
  const chatWidth = useSubscription(chatWidthValue)
  const loggerHeight = useSubscription(loggerHeightValue)
  const setStore = (
    patch: { chatOpened: boolean } | { loggerOpened: boolean }
  ) => store.set((state) => ({ ...state, ...patch }) satisfies typeof state)

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

  const fetching = useFetchingConfig(connection)

  if (fetching.type === 'waiting-for-password') {
    return (
      <PasswordForm
        connection={connection}
        connectionResource={connectionResource}
      />
    )
  }

  return (
    <ResizableGroup orientation="horizontal" className="p-2">
      <ResizablePanel
        size={navigatorWidth}
        onSizeChange={(width) => navigatorWidthValue.set(width)}
        defaultSize={SIDEBAR_DEFAULT_WIDTH}
        minSize={SIDEBAR_MIN_WIDTH}
        className="origin-left"
        initial={{ scale: 0.85 }}
        animate={{ scale: 1 }}
        maxSize={SIDEBAR_MAX_WIDTH}
        collapsed={!navigatorOpened}
        onCollapsedChange={(collapsed) => navigatorOpenValue.set(!collapsed)}
      >
        <Navigator />
      </ResizablePanel>
      <ResizableSeparator aria-label="Resize navigator" />
      <ResizablePanel className="flex flex-col">
        <ResizableGroup orientation="vertical">
          <ResizablePanel className="flex flex-col">
            <div className={resourcePanelClassName}>
              <TabBar />
              <Outlet />
            </div>
          </ResizablePanel>
          <ResizableSeparator aria-label="Resize query logger" />
          <ResizablePanel
            size={loggerHeight}
            onSizeChange={(height) => loggerHeightValue.set(height)}
            defaultSize={LOGGER_DEFAULT_HEIGHT}
            minSize={LOGGER_MIN_HEIGHT}
            maxSize={LOGGER_MAX_HEIGHT}
            collapsed={!loggerOpened}
            initial={{ translateY: '100%' }}
            animate={{ translateY: '0' }}
            onCollapsedChange={(collapsed) =>
              setStore({ loggerOpened: !collapsed })
            }
          >
            <div className="flex h-full flex-col pt-1.5">
              <div className={resourcePanelClassName}>
                <Suspense fallback={<QueryLoggerSkeleton />}>
                  <QueryLogger connectionResource={connectionResource} />
                </Suspense>
              </div>
            </div>
          </ResizablePanel>
        </ResizableGroup>
      </ResizablePanel>
      <ResizableSeparator aria-label="Resize chat" />
      <ResizablePanel
        size={chatWidth}
        onSizeChange={(width) => chatWidthValue.set(width)}
        defaultSize={CHAT_DEFAULT_WIDTH}
        initial={{ translateX: '100%' }}
        animate={{ translateX: '0' }}
        minSize={CHAT_MIN_WIDTH}
        maxSize={CHAT_MAX_WIDTH}
        collapsed={!chatOpened}
        onCollapsedChange={(collapsed) => setStore({ chatOpened: !collapsed })}
      >
        <ChatPanel />
      </ResizablePanel>
    </ResizableGroup>
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
