import { title } from '@conar/shared/utils/title'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@conar/ui/components/resizable'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { type } from 'arktype'
import { useEffect } from 'react'
import { AppToolbar, useLayoutShortcuts } from '~/components/app-toolbar'
import { databaseStore } from '~/entities/database'
import { layoutStore, toggleChat } from '~/lib/layout-store'
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

function DatabaseSqlPage() {
  const { database } = Route.useLoaderData()
  const { chatId } = Route.useSearch()
  const store = databaseStore(database.id)
  const navigate = useNavigate()

  const { chatVisible, chatPosition } = useStore(layoutStore, s => ({
    chatVisible: s.chatVisible,
    chatPosition: s.chatPosition,
  }))

  useEffect(() => {
    store.setState(state => ({
      ...state,
      lastOpenedChatId: chatId ?? null,
    } satisfies typeof state))
  }, [chatId, store])

  const handleNewChat = () => {
    store.setState(state => ({
      ...state,
      lastOpenedChatId: null,
    }))

    if (!layoutStore.state.chatVisible) {
      toggleChat()
    }
    navigate({
      to: '/database/$id/sql',
      params: { id: database.id },
    })
  }

  useLayoutShortcuts({
    onNewChat: handleNewChat,
  })

  const isChatRight = chatPosition === 'right'
  const direction = isChatRight ? 'horizontal' : 'vertical'

  return (
    <div className="flex h-full flex-col">
      <div className={`
        flex h-9 shrink-0 items-center border-b bg-background/50 px-2
        backdrop-blur-sm
      `}
      >
        <AppToolbar onNewChat={handleNewChat} />
      </div>

      <div className="min-h-0 flex-1">
        <ResizablePanelGroup
          autoSaveId={`sql-layout-main-${direction}`}
          direction={direction}
          className="h-full"
        >
          <ResizablePanel
            defaultSize={chatVisible ? 70 : 100}
            minSize={30}
            className="m-1 mr-0 flex flex-col rounded-lg border bg-background"
          >
            <Runner />
          </ResizablePanel>

          {chatVisible && (
            <>
              <ResizableHandle className={isChatRight
                ? 'w-1 bg-transparent'
                : `h-1 bg-transparent`}
              />
              <ResizablePanel
                defaultSize={30}
                minSize={15}
                maxSize={50}
                className="m-1 rounded-lg border bg-background"
              >
                <Chat className="h-full" />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
