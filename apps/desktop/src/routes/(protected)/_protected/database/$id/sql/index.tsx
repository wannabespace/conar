import { title } from '@conar/shared/utils/title'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@conar/ui/components/resizable'
import { createFileRoute } from '@tanstack/react-router'
import { type } from 'arktype'
import { chatMessages, chatQuery, createChat } from './-chat'
import { Chat as ChatComponent } from './-components/chat'
import { Runner } from './-components/runner'
import { pageStore } from './-lib'

export const Route = createFileRoute(
  '/(protected)/_protected/database/$id/sql/',
)({
  component: DatabaseSqlPage,
  validateSearch: type({
    'chatId?': 'string',
  }),
  // The route shouldn't refresh due to have always the same chat instance,
  // otherwise the chat will have an issue with a message stream
  staleTime: Infinity,
  loaderDeps: ({ search }) => ({ chatId: search.chatId }),
  loader: async ({ params, context, deps }) => {
    pageStore.setState(state => ({
      ...state,
      query: chatQuery.get(params.id),
    }))

    console.log('deps.chatId', deps.chatId)

    return {
      database: context.database,
      chat: createChat({
        id: deps.chatId,
        database: context.database,
        messages: deps.chatId ? await chatMessages.get(deps.chatId) : [],
      }),
    }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          {
            title: title('SQL Runner', loaderData.database.name),
          },
        ]
      : [],
  }),
})

function DatabaseSqlPage() {
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
