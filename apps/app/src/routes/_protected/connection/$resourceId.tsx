import { UnavailableIcon } from '@hugeicons/core-free-icons'
import { title } from '@tamery/shared/title'
import { Button } from '@tamery/ui/components/button'
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
import { useEffect } from 'react'
import { useSubscription } from 'seitu/react'

import { PaneEmpty } from '~/components/pane-empty'
import {
  prefetchConnectionResourceCore,
  useFetchingConfig,
} from '~/core/connection/fetching'
import { FetchingReason } from '~/core/connection/fetching-reason'
import {
  lastOpenedResourcesStorageValue,
  MAX_REMEMBERED_RESOURCES,
} from '~/core/connection/last-opened-resources'
import { useShortcut } from '~/core/keyboard/use-shortcuts'
import { workspaceSelection } from '~/core/workspace/utils'
import { useGoBack } from '~/hooks/use-go-back'
import type { Panel } from '~/lib/panels'
import { panelSize, useShellLayout } from '~/lib/panels'
import { chatPanel } from '~/modules/chat/panel'
import { useEscapeToNavigator } from '~/modules/navigator/keyboard'
import { navigatorPanel } from '~/modules/navigator/panel'
import { navigatorOpenValue } from '~/modules/navigator/stores'
import { toggleLogger } from '~/modules/query-logger/logger-open'
import { queryLoggerPanel } from '~/modules/query-logger/panel'
import { TabBar } from '~/modules/tab-bar/tab-bar'
import { resourcePanelClassName } from '~/shell'

import { ConnectionError } from './-components/connection-error'
import { UnlockForm } from './-components/unlock-form'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const REGION_MOTION = {
  bottom: {
    animate: { translateY: '0' },
    initial: { translateY: '100%' },
  },
  left: {
    animate: { scale: 1 },
    className: 'origin-left',
    initial: { scale: 0.85 },
  },
  right: {
    animate: { translateX: '0' },
    initial: { translateX: '100%' },
  },
}

const RegionPanel = ({
  panel,
  resourceId,
}: {
  panel: Panel
  resourceId: string
}) => {
  const openValue = panel.open(resourceId)
  const sizeValue = panelSize(panel)
  const opened = useSubscription(openValue)
  const size = useSubscription(sizeValue)
  const { Component } = panel
  const separator = (
    <ResizableSeparator key="separator" aria-label={`Resize ${panel.label}`} />
  )
  const content = (
    <ResizablePanel
      key="panel"
      size={size}
      onSizeChange={(next) => sizeValue.set(next)}
      defaultSize={panel.defaultSize}
      minSize={panel.minSize}
      maxSize={panel.maxSize}
      collapsed={!opened}
      onCollapsedChange={(collapsed) => openValue.set(!collapsed)}
      {...REGION_MOTION[panel.region]}
    >
      <Component />
    </ResizablePanel>
  )

  return panel.region === 'left' ? [content, separator] : [separator, content]
}

const ResourcePage = () => {
  const { connection, connectionResource } = useRouteContext()
  const goBack = useGoBack()

  useShellLayout(connectionResource.id)

  useEffect(() => {
    const last = lastOpenedResourcesStorageValue.get()
    if (last[0] !== connectionResource.id) {
      lastOpenedResourcesStorageValue.set(
        [
          connectionResource.id,
          ...last.filter((resourceId) => resourceId !== connectionResource.id),
        ].slice(0, MAX_REMEMBERED_RESOURCES)
      )
    }
  }, [connectionResource.id])

  const fetching = useFetchingConfig(connection)
  const needsDetails = fetching.type === 'waiting-for-details'
  const locked = fetching.type === 'waiting-for-password' || needsDetails

  useShortcut(
    'toggleNavigator',
    () => navigatorOpenValue.set((open) => !open),
    {
      enabled: !locked,
    }
  )
  useShortcut('queryLogger', () => toggleLogger(connectionResource.id), {
    enabled: !locked,
  })
  useEscapeToNavigator(!locked)

  if (locked) {
    return (
      <UnlockForm
        connection={connection}
        resourceName={connectionResource.name}
        scope={needsDetails ? 'details' : 'credentials'}
      />
    )
  }

  if (!fetching.canSend && fetching.reason) {
    return (
      <div className="flex h-screen min-h-[inherit] flex-col">
        <PaneEmpty
          icon={UnavailableIcon}
          title="Can't open this connection here"
          description={<FetchingReason reason={fetching.reason} />}
        >
          <Button variant="outline" onClick={goBack}>
            Back
          </Button>
        </PaneEmpty>
      </div>
    )
  }

  return (
    <ResizableGroup orientation="horizontal" className="p-2">
      <RegionPanel panel={navigatorPanel} resourceId={connectionResource.id} />
      <ResizablePanel className="flex flex-col">
        <ResizableGroup orientation="vertical">
          <ResizablePanel className="flex flex-col">
            <div className={resourcePanelClassName}>
              <TabBar />
              <Outlet />
            </div>
          </ResizablePanel>
          <RegionPanel
            panel={queryLoggerPanel}
            resourceId={connectionResource.id}
          />
        </ResizableGroup>
      </ResizablePanel>
      <RegionPanel panel={chatPanel} resourceId={connectionResource.id} />
    </ResizableGroup>
  )
}

export const Route = createFileRoute('/_protected/connection/$resourceId')({
  component: ResourcePage,
  errorComponent: ConnectionError,
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
