import type { ToolCall } from '@conar/shared/ai'
import { Chat } from '@ai-sdk/react'
import { title } from '@conar/shared/utils/title'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@conar/ui/components/resizable'
import { createFileRoute } from '@tanstack/react-router'
import { DefaultChatTransport } from 'ai'
import { columnsQuery, databaseEnumsQuery, tablesAndSchemasQuery } from '~/entities/database'
import { queryClient } from '~/main'
import { chatMessages, chatQuery } from './-chat'
import { Chat as ChatComponent } from './-components/chat'
import { Runner } from './-components/runner'
import { pageStore } from './-lib'

export const Route = createFileRoute(
  '/(protected)/_protected/database/$id/sql/',
)({
  component: DatabaseSqlPage,
  loader: async ({ params, context }) => {
    pageStore.setState(state => ({
      ...state,
      query: chatQuery.get(params.id),
    }))

    const chat = new Chat({
      id: params.id,
      transport: new DefaultChatTransport({
        api: `${import.meta.env.VITE_PUBLIC_API_URL}/ai/v2/sql-chat`,
        credentials: 'include',
        body: async () => ({
          type: context.database.type,
          model: pageStore.state.model,
          currentQuery: pageStore.state.query,
          context: await queryClient.ensureQueryData(tablesAndSchemasQuery(context.database)),
        }),
      }),
      messages: await chatMessages.get(params.id),
      maxSteps: 20,
      onToolCall: async ({ toolCall }) => {
        const call = toolCall as Pick<ToolCall, 'toolName' | 'input'>

        if (call.toolName === 'columns') {
          return queryClient.ensureQueryData(columnsQuery(
            context.database,
            call.input.tableName,
            call.input.schemaName,
          ))
        }

        if (call.toolName === 'enums') {
          return queryClient.ensureQueryData(databaseEnumsQuery(context.database))
        }
      },
    })

    return {
      database: context.database,
      chat,
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
