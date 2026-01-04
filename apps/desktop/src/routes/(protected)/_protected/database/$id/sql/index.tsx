import { title } from '@conar/shared/utils/title'
import { ResizablePanel, ResizablePanelGroup, ResizableSeparator } from '@conar/ui/components/resizable'
import { createFileRoute } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { type } from 'arktype'
import { useEffect } from 'react'
import { useDefaultLayout } from 'react-resizable-panels'
import { databaseStore } from '~/entities/database/store'
import { Chat, createChat } from './-components/chat'
import { Runner } from './-components/runner'

export const Route = createFileRoute(
  '/(protected)/_protected/database/$id/sql/',
)({
  component: DatabaseSqlPage,
  validateSearch: type({
    'chatId?': 'string.uuid.v7 | undefined',
    'error?': 'string | undefined',
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    return {
      database: context.database,
      chat: await createChat({
        id: deps.chatId,
        database: context.database,
      }),
    }
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: title('SQL Runner', loaderData.database.name) }] : [],
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

function RunnerPanel({ chatVisible = true }: { chatVisible?: boolean }) {
  return (
    <ResizablePanel
      defaultSize={chatVisible ? '70%' : '100%'}
      minSize="30%"
      className="rounded-lg border bg-background"
    >
      <Runner />
    </ResizablePanel>
  )
}

function DatabaseSqlPage() {
  const { database } = Route.useLoaderData()
  const { chatId } = Route.useSearch()
  const store = databaseStore(database.id)

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

  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    id: `sql-layout-${database.id}`,
    storage: localStorage,
  })

  return (
    <ResizablePanelGroup
      defaultLayout={defaultLayout}
      onLayoutChange={onLayoutChange}
      orientation="horizontal"
      className="flex h-full"
    >
      {chatVisible
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
            <RunnerPanel key="runner" chatVisible={false} />
          )}
    </ResizablePanelGroup>
  )
}
