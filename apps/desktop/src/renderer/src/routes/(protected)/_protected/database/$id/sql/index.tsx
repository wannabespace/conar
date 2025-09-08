import { title } from '@conar/shared/utils/title'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@conar/ui/components/resizable'
import { createFileRoute } from '@tanstack/react-router'
import { type } from 'arktype'
import { useEffect } from 'react'
import { chatQuery, createChat, lastOpenedChatId } from './-chat'
import { Chat as ChatComponent } from './-components/chat'
import { Runner } from './-components/runner'
import { pageStore } from './-lib'

export const Route = createFileRoute(
  '/(protected)/_protected/database/$id/sql/',
)({
  component: DatabaseSqlPage,
  validateSearch: type({
    'chatId?': 'string.uuid.v7',
    'error?': 'string',
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ params, context, deps }) => {
    pageStore.setState(state => ({
      ...state,
      query: chatQuery.get(params.id),
    }))

    return {
      database: context.database,
      chat: createChat({
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
  const { id } = Route.useParams()
  const { chatId = null } = Route.useSearch()

  useEffect(() => {
    lastOpenedChatId.set(id, chatId)
  }, [id, chatId])

  return (
    <ResizablePanelGroup autoSaveId="sql-layout-x" direction="horizontal" className="flex">
      <ResizablePanel
        defaultSize={30}
        minSize={20}
        maxSize={50}
        className="border bg-background rounded-lg"
      >
        <ChatComponent className="h-full" />
      </ResizablePanel>
      <ResizableHandle className="w-1 bg-transparent" />
      <ResizablePanel
        minSize={30}
        maxSize={80}
        className="flex flex-col gap-4 border bg-background rounded-lg"
      >
        <Runner />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
