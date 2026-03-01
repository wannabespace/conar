import { ConnectionType } from '@conar/shared/enums/connection-type'
import { title } from '@conar/shared/utils/title'
import { ResizablePanel, ResizablePanelGroup, ResizableSeparator } from '@conar/ui/components/resizable'
import { createFileRoute } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { type } from 'arktype'
import { useEffect } from 'react'
import { useDefaultLayout } from 'react-resizable-panels'
import { connectionStore } from '~/entities/connection/store'
import { queryClient } from '~/main'
import { Chat, createChat } from './-components/chat'
import { RedisRunner } from './-components/redis-runner'
import { redisKeysQueryOptions } from './-components/redis-runner/lib/hooks'
import { Runner } from './-components/runner'

export const Route = createFileRoute(
  '/_protected/database/$id/sql/',
)({
  component: DatabaseSqlPage,
  validateSearch: type({
    'chatId?': 'string.uuid.v7 | undefined',
    'error?': 'string | undefined',
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const { connection } = context
    if (connection.type === ConnectionType.Redis && connection.connectionString) {
      queryClient.prefetchQuery(redisKeysQueryOptions(connection, ''))
    }
    return {
      connection,
      chat: await createChat({
        id: deps.chatId,
        connection,
      }),
    }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [{ title: title(loaderData.connection.type === 'redis' ? 'Redis' : 'SQL Runner', loaderData.connection.name) }]
      : [],
  }),
})

const MIN_CHAT_SIZE = '15%'

function ChatPanel() {
  return (
    <ResizablePanel
      defaultSize="30%"
      minSize={MIN_CHAT_SIZE}
      maxSize="50%"
      className="rounded-lg border bg-background"
    >
      <Chat className="h-full" />
    </ResizablePanel>
  )
}

function RunnerPanel({ chatVisible = true, isRedis = false }: { chatVisible?: boolean, isRedis?: boolean }) {
  return (
    <ResizablePanel
      defaultSize={chatVisible ? '70%' : '100%'}
      minSize="30%"
      className="rounded-lg border bg-background"
    >
      {isRedis ? <RedisRunner /> : <Runner />}
    </ResizablePanel>
  )
}

function DatabaseSqlPage() {
  const { connection } = Route.useLoaderData()
  const { chatId } = Route.useSearch()
  const store = connectionStore(connection.id)
  const isRedis = connection.type === ConnectionType.Redis

  const { chatVisible, chatPosition } = useStore(store, s => ({
    chatVisible: s.layout.chatVisible,
    chatPosition: s.layout.chatPosition,
  }))

  useEffect(() => {
    store.setState(state => ({
      ...state,
      lastOpenedChatId: chatId ?? null,
    } satisfies typeof state))
  }, [chatId, store])

  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: `sql-layout-${connection.id}`,
    storage: localStorage,
  })

  return (
    <ResizablePanelGroup
      defaultLayout={defaultLayout}
      onLayoutChanged={onLayoutChanged}
      orientation="horizontal"
      className="flex h-full"
    >
      {!isRedis && chatVisible
        ? (
            <>
              {chatPosition === 'left'
                ? (
                    <>
                      <ChatPanel key="chat" />
                      <ResizableSeparator className="w-1" />
                      <RunnerPanel key="runner" />
                    </>
                  )
                : (
                    <>
                      <RunnerPanel key="runner" />
                      <ResizableSeparator className="w-1" />
                      <ChatPanel key="chat" />
                    </>
                  )}
            </>
          )
        : (
            <RunnerPanel key="runner" chatVisible={false} isRedis={isRedis} />
          )}
    </ResizablePanelGroup>
  )
}
