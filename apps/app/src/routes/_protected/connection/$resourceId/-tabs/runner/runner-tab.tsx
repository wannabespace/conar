import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@tamery/ui/components/resizable'
import { getRouteApi } from '@tanstack/react-router'
import { useEffect, useMemo } from 'react'
import { useDefaultLayout } from 'react-resizable-panels'
import { useSubscription } from 'seitu/react'

import { Chat } from './-components/chat'
import { Runner } from './-components/runner'
import {
  RunnerTabContext,
  useRunnerPageStore,
  useRunnerTab,
} from './-lib/store'

const routeApi = getRouteApi('/_protected/connection/$resourceId/$tabId')

const MIN_CHAT_SIZE = '200px'

const ChatPanel = () => (
  <ResizablePanel defaultSize="300px" minSize={MIN_CHAT_SIZE} maxSize="50%">
    <Chat className="h-full" />
  </ResizablePanel>
)

const RunnerPanel = ({ chatVisible = true }: { chatVisible?: boolean }) => (
  <ResizablePanel defaultSize={chatVisible ? '70%' : '100%'} minSize="30%">
    <Runner />
  </ResizablePanel>
)

const RunnerLayout = () => {
  const { chatId } = routeApi.useSearch()
  const { resourceId, tabId } = useRunnerTab()
  const store = useRunnerPageStore()

  const { chatVisible, chatPosition } = useSubscription(store, {
    selector: (s) => ({
      chatVisible: s.layout.chatVisible,
      chatPosition: s.layout.chatPosition,
    }),
  })

  useEffect(() => {
    store.set(
      (state) => ({ ...state, chatId: chatId ?? null }) satisfies typeof state
    )
  }, [chatId, store])

  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: `sql-layout-${resourceId}-${tabId}`,
    storage: localStorage,
  })

  let panels
  if (!chatVisible) {
    panels = <RunnerPanel key="runner" chatVisible={false} />
  } else if (chatPosition === 'left') {
    panels = (
      <>
        <ChatPanel key="chat" />
        <ResizableHandle className="w-1" />
        <RunnerPanel key="runner" />
      </>
    )
  } else {
    panels = (
      <>
        <RunnerPanel key="runner" />
        <ResizableHandle className="w-1" />
        <ChatPanel key="chat" />
      </>
    )
  }

  return (
    <ResizablePanelGroup
      defaultLayout={defaultLayout}
      onLayoutChanged={onLayoutChanged}
      orientation="horizontal"
      className="flex min-h-0 flex-1"
    >
      {panels}
    </ResizablePanelGroup>
  )
}

export const RunnerTab = ({ tabId }: { tabId: string }) => {
  const { connectionResource } = routeApi.useRouteContext()
  const tab = useMemo(
    () => ({ resourceId: connectionResource.id, tabId }),
    [connectionResource.id, tabId]
  )

  return (
    <RunnerTabContext value={tab}>
      <RunnerLayout />
    </RunnerTabContext>
  )
}
