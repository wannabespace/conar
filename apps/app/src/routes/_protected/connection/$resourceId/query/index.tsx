import { title } from '@tamery/shared/utils/title'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@tamery/ui/components/resizable'
import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { type } from 'arktype'
import { useEffect } from 'react'
import { useDefaultLayout } from 'react-resizable-panels'
import { useSubscription } from 'seitu/react'
import { v7 } from 'uuid'

import { getConnectionResourceStore } from '~/entities/connection/store'

import { Chat, createChat } from './-components/chat'
import { Runner } from './-components/runner'

const routeApi = getRouteApi('/_protected/connection/$resourceId/query/')

const MIN_CHAT_SIZE = '200px'

const ChatPanel = () => (
  <ResizablePanel
    defaultSize="300px"
    minSize={MIN_CHAT_SIZE}
    maxSize="50%"
    className="bg-background rounded-lg"
  >
    <Chat className="h-full" />
  </ResizablePanel>
)

const RunnerPanel = ({ chatVisible = true }: { chatVisible?: boolean }) => (
  <ResizablePanel
    defaultSize={chatVisible ? '70%' : '100%'}
    minSize="30%"
    className="bg-background rounded-lg"
  >
    <Runner />
  </ResizablePanel>
)

const DatabaseSqlPage = () => {
  const { connectionResource } = routeApi.useRouteContext()
  const { chatId } = routeApi.useSearch()
  const store = getConnectionResourceStore(connectionResource.id)

  const { chatVisible, chatPosition } = useSubscription(store, {
    selector: (s) => ({
      chatVisible: s.layout.chatVisible,
      chatPosition: s.layout.chatPosition,
    }),
  })

  useEffect(() => {
    store.set(
      (state) =>
        ({
          ...state,
          lastOpenedChatId: chatId ?? null,
        }) satisfies typeof state
    )
  }, [chatId, store])

  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: `sql-layout-${connectionResource.id}`,
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
      className="flex h-full"
    >
      {panels}
    </ResizablePanelGroup>
  )
}

export const Route = createFileRoute(
  '/_protected/connection/$resourceId/query/'
)({
  component: DatabaseSqlPage,
  validateSearch: type({
    'chatId?': 'string.uuid.v7 | undefined',
    'error?': 'string | undefined',
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const { chatsCollection, chatsMessagesCollection } = context.collections

    await Promise.all([
      chatsCollection.stateWhenReady(),
      chatsMessagesCollection.stateWhenReady(),
    ])

    return {
      connection: context.connection,
      connectionResource: context.connectionResource,
      chat: await createChat({
        id: deps.chatId ?? v7(),
        connectionResource: context.connectionResource,
      }),
    }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          {
            title: title(
              'SQL Runner',
              loaderData.connection.name,
              loaderData.connectionResource.name
            ),
          },
        ]
      : [],
  }),
})
