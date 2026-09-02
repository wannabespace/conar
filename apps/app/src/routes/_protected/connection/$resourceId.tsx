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
import { lazy, Suspense, useEffect, useState } from 'react'
import { usePanelRef } from 'react-resizable-panels'
import { useSubscription } from 'seitu/react'

import { QueryLoggerSkeleton } from '~/entities/connection/components/query-logger-skeleton'
import type { ConnectionResource } from '~/entities/connection/core'
import {
  loggerHeightValue,
  LOGGER_MAX_HEIGHT,
  LOGGER_MIN_HEIGHT,
} from '~/entities/connection/runtime/log'
import { getConnectionResourceStore } from '~/entities/connection/store'
import { prefetchConnectionResourceCore } from '~/entities/connection/utils'
import { useFetchingConfig } from '~/entities/connection/utils/fetching'
import { lastOpenedResourcesStorageValue } from '~/entities/connection/utils/last-opened-resources'
import { getActiveWorkspace } from '~/entities/workspace/utils'
import { LOGGER_DEFAULT_HEIGHT } from '~/lib/storage-keys'
import { resourcePanelClassName } from '~/shell'

import { ChatPanel } from './$resourceId/-components/chat/chat-panel'
import { CHAT_PANEL_ID } from './$resourceId/-components/chat/constants'
import {
  NAVIGATOR_PANEL_ID,
  navigatorOpenValue,
} from './$resourceId/-components/navigator/constants'
import { Navigator } from './$resourceId/-components/navigator/navigator'
import { TabBar } from './$resourceId/-components/tab-bar'
import { PasswordForm } from './-components/password-form'

const LOGGER_PANEL_ID = 'panel-logger'

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
  const height = useSubscription(loggerHeightValue)
  const panelRef = usePanelRef()
  const [mounted, setMounted] = useState(opened)

  if (opened && !mounted) {
    setMounted(true)
  }

  return (
    <>
      <ResizableHandle
        aria-label="Resize query logger"
        className="-mb-1.5"
        disabled={!opened}
        disableDoubleClick
        onDoubleClick={() => panelRef.current?.resize(LOGGER_DEFAULT_HEIGHT)}
      />
      <ResizablePanel
        id={LOGGER_PANEL_ID}
        panelRef={panelRef}
        collapsed={!opened}
        defaultSize={height}
        minSize={LOGGER_MIN_HEIGHT}
        maxSize={LOGGER_MAX_HEIGHT}
        groupResizeBehavior="preserve-pixel-size"
        style={{ overflow: 'visible' }}
        onResize={({ inPixels }) => {
          if (inPixels > 0) {
            loggerHeightValue.set(inPixels)
          }
        }}
      >
        <div className="flex flex-col pt-1.5" style={{ height }}>
          <div className={resourcePanelClassName}>
            {mounted && (
              <Suspense fallback={<QueryLoggerSkeleton />}>
                <QueryLogger connectionResource={connectionResource} />
              </Suspense>
            )}
          </div>
        </div>
      </ResizablePanel>
    </>
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
    <ResizablePanelGroup
      orientation="horizontal"
      className="p-2"
      style={{ overflow: 'visible' }}
      onLayoutChanged={(layout, { isUserInteraction }) => {
        if (!isUserInteraction) {
          return
        }
        if (layout[NAVIGATOR_PANEL_ID] === 0) {
          navigatorOpenValue.set(false)
        }
        if (layout[CHAT_PANEL_ID] === 0) {
          store.set(
            (state) => ({ ...state, chatOpened: false }) satisfies typeof state
          )
        }
      }}
    >
      <Navigator />
      <ResizablePanel className="flex flex-col" style={{ overflow: 'visible' }}>
        <ResizablePanelGroup
          orientation="vertical"
          style={{ overflow: 'visible' }}
          onLayoutChanged={(layout, { isUserInteraction }) => {
            if (isUserInteraction && layout[LOGGER_PANEL_ID] === 0) {
              store.set(
                (state) =>
                  ({ ...state, loggerOpened: false }) satisfies typeof state
              )
            }
          }}
        >
          <ResizablePanel
            className="flex flex-col"
            style={{ overflow: 'visible' }}
          >
            <div className={resourcePanelClassName}>
              <TabBar />
              <Outlet />
            </div>
          </ResizablePanel>
          <QueryLoggerPanel
            connectionResource={connectionResource}
            opened={loggerOpened}
          />
        </ResizablePanelGroup>
      </ResizablePanel>
      <ChatPanel />
    </ResizablePanelGroup>
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
