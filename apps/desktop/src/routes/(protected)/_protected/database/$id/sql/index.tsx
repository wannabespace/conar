import { title } from '@conar/shared/utils/title'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@conar/ui/components/resizable'
import { createFileRoute } from '@tanstack/react-router'
import { type } from 'arktype'
import { useEffect } from 'react'
import { databaseStore } from '../../-store'
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

  useEffect(() => {
    store.setState(state => ({
      ...state,
      lastOpenedChatId: chatId ?? null,
    } satisfies typeof state))
  }, [chatId, store])

  return (
    <ResizablePanelGroup autoSaveId="sql-layout-x" direction="horizontal" className="flex">
      <ResizablePanel
        defaultSize={70}
        minSize={30}
        maxSize={80}
        className="flex flex-col gap-4 border bg-background rounded-lg"
      >
        <Runner />
      </ResizablePanel>
      <ResizableHandle className="w-1 bg-transparent" />
      <ResizablePanel
        defaultSize={30}
        minSize={20}
        maxSize={50}
        className="border bg-background rounded-lg"
      >
        <Chat className="h-full" />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
