import type { connections } from '~/drizzle'
import type { Definitions } from '~/entities/connection/store'
import { ResizablePanel, ResizablePanelGroup, ResizableSeparator } from '@conar/ui/components/resizable'
import { createFileRoute, Outlet, redirect, useLocation, useRouter } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { useEffect, useEffectEvent } from 'react'
import { useDefaultLayout } from 'react-resizable-panels'
import { addDefinitionTab, connectionStore, removeDefinitionTab, updateDefinitionTabs } from '~/entities/connection/store'
import { EmptyDefinition } from './definitions/-components/empty-definition'
import { Sidebar } from './definitions/-components/sidebar'
import { DefinitionsTabs } from './definitions/-components/tabs'

export const Route = createFileRoute(
  '/_protected/database/$id/definitions',
)({
  component: DefinitionsSideTabsLayout,
  beforeLoad: ({ location, params }) => {
    if (location.pathname.endsWith('/definitions') || location.pathname.endsWith('/definitions/')) {
      const storeState = connectionStore(params.id).state
      const lastOpened = storeState.lastOpenedDefinition
      const tabs = storeState.definitionTabs ?? []

      if (tabs.length > 0) {
        const target = lastOpened && tabs.some(t => t.type === lastOpened)
          ? lastOpened
          : tabs[0]?.type

        if (target) {
          throw redirect({
            to: `/database/$id/definitions/${target}`,
            params: { id: params.id },
            replace: true,
          })
        }
      }
    }
  },
})

const definitionTabs = ['indexes', 'constraints', 'enums'] as const

function DefinitionsSideTabsLayout() {
  const { id } = Route.useParams()
  const { connection } = Route.useRouteContext() as { connection: typeof connections.$inferSelect }
  const store = connectionStore(connection.id)
  const router = useRouter()
  const location = useLocation()

  const currentPath = definitionTabs.find(p => location.pathname.includes(`/${p}`)) ?? null

  const tabs = useStore(store, state => (state.definitionTabs ?? []).map(t => t.type))

  const syncLastOpened = useEffectEvent((pathSegment: Definitions) => {
    if (pathSegment && (definitionTabs).includes(pathSegment)) {
      addDefinitionTab(connection.id, pathSegment)
    }
  })

  useEffect(() => {
    if (currentPath) {
      syncLastOpened(currentPath)
    }
  }, [currentPath])

  const handleTabClick = (pathSegment: Definitions) => {
    addDefinitionTab(connection.id, pathSegment)
  }

  const handleCloseTab = async (tabToClose: Definitions) => {
    const currentTabs = store.state.definitionTabs ?? []

    removeDefinitionTab(connection.id, tabToClose)

    const newTabs = currentTabs.filter(t => t.type !== tabToClose)

    if (tabToClose === currentPath) {
      const index = currentTabs.findIndex(t => t.type === tabToClose)
      const nextTabObj = newTabs[index] || newTabs[index - 1]
      const nextTab = nextTabObj?.type

      if (nextTab) {
        store.setState(state => ({ ...state, lastOpenedDefinition: nextTab } satisfies typeof state))
        await router.navigate({
          to: `/database/$id/definitions/${nextTab}`,
          params: { id: connection.id },
        })
      }
      else {
        await router.navigate({
          to: `/database/$id/definitions`,
          params: { id: connection.id },
        })
      }
    }
  }

  useEffect(() => {
    const currentTabs = store.state.definitionTabs ?? []
    if (currentPath && (definitionTabs).includes(currentPath)) {
      if (!currentTabs.some(t => t.type === currentPath)) {
        syncLastOpened(currentPath)
      }
    }
  }, [])

  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    id: `database-definitions-layout-${connection.id}`,
    storage: localStorage,
  })

  return (
    <ResizablePanelGroup
      defaultLayout={defaultLayout}
      onLayoutChange={onLayoutChange}
      orientation="horizontal"
      className="flex size-full"
    >
      <Sidebar connection={connection} updateLastOpened={handleTabClick} id={id} />

      <ResizableSeparator className="w-1 bg-transparent" />

      <ResizablePanel
        defaultSize="80%"
        className="flex-1 rounded-lg border bg-background"
      >
        {tabs.length > 0
          ? (
              <div className="flex h-full flex-col">
                <DefinitionsTabs
                  className="h-9"
                  currentTab={currentPath}
                  tabs={tabs}
                  onClose={handleCloseTab}
                  onReorder={(newTabs) => {
                    updateDefinitionTabs(connection.id, newTabs.map(t => ({ type: t })))
                  }}
                />
                <main className="size-full flex-1 overflow-auto">
                  <Outlet />
                </main>
              </div>
            )
          : <EmptyDefinition />}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
