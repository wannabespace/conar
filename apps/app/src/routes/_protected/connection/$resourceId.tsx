import { title } from '@tamery/shared/title'
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

import {
  prefetchConnectionResourceCore,
  useFetchingConfig,
} from '~/core/connection/fetching'
import { lastOpenedResourcesStorageValue } from '~/core/connection/last-opened-resources'
import { workspaceSelection } from '~/core/workspace/utils'
import type { Panel } from '~/lib/module'
import { panelSize, useShellLayout } from '~/lib/panels'
import { workspaceModules } from '~/lib/workspace-modules'
import { resourcePanelClassName } from '~/shell'

import { PasswordForm } from './-components/password-form'

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

  useShellLayout(connectionResource.id)

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
  const leftPanel = workspaceModules.panelIn('left')
  const bottomPanel = workspaceModules.panelIn('bottom')
  const rightPanel = workspaceModules.panelIn('right')

  if (fetching.type === 'waiting-for-password') {
    return (
      <PasswordForm
        connection={connection}
        connectionResource={connectionResource}
      />
    )
  }

  return (
    <>
      {workspaceModules.mounts.map((Mount, index) => (
        <Mount key={index} />
      ))}
      <ResizableGroup orientation="horizontal" className="p-2">
        {leftPanel && (
          <RegionPanel panel={leftPanel} resourceId={connectionResource.id} />
        )}
        <ResizablePanel className="flex flex-col">
          <ResizableGroup orientation="vertical">
            <ResizablePanel className="flex flex-col">
              <div className={resourcePanelClassName}>
                {workspaceModules.headers.map((Header, index) => (
                  <Header key={index} />
                ))}
                <Outlet />
              </div>
            </ResizablePanel>
            {bottomPanel && (
              <RegionPanel
                panel={bottomPanel}
                resourceId={connectionResource.id}
              />
            )}
          </ResizableGroup>
        </ResizablePanel>
        {rightPanel && (
          <RegionPanel panel={rightPanel} resourceId={connectionResource.id} />
        )}
      </ResizableGroup>
    </>
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
