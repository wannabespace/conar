import { title } from '@conar/shared/utils/title'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@conar/ui/components/resizable'
import { createFileRoute } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { type } from 'arktype'
import { useEffect } from 'react'
import { databaseStore } from '~/entities/database'
import { Chat, createChat } from './-components/chat'
import { Runner } from './-components/runner'
import { SqlToolbar } from './-components/sql-toolbar'

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

  const isChatRight = chatPosition === 'right'

  return (
    <div className="flex h-full flex-col">
      <div className={`
        flex h-9 shrink-0 items-center border-b bg-background/50 px-2
        backdrop-blur-sm
      `}
      >
        <SqlToolbar databaseId={database.id} />
      </div>

      <div className="min-h-0 flex-1">
        <ResizablePanelGroup
          autoSaveId="sql-layout-main"
          direction="horizontal"
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
              <ResizableHandle
                className={isChatRight
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
