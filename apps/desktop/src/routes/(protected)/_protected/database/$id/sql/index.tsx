import type { tools } from '@conar/shared/ai'
import type { InferToolInput } from 'ai'
import { Chat } from '@ai-sdk/react'
import { rowsSql } from '@conar/shared/sql/rows'
import { whereSql } from '@conar/shared/sql/where'
import { title } from '@conar/shared/utils/title'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@conar/ui/components/resizable'
import { createFileRoute } from '@tanstack/react-router'
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai'
import { useState } from 'react'
import { databaseEnumsQuery, databaseTableColumnsQuery, tablesAndSchemasQuery } from '~/entities/database'
import { dbQuery } from '~/lib/query'
import { queryClient } from '~/main'
import { chatMessages, chatQuery } from './-chat'
import { Chat as ChatComponent } from './-components/chat'
import { ChatProvider } from './-components/chat-provider'
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

    return {
      database: context.database,
      messages: await chatMessages.get(params.id),
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
  const { id } = Route.useParams()
  const { messages, database } = Route.useLoaderData()
  const [chat] = useState(() => new Chat({
    id,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    transport: new DefaultChatTransport({
      api: `${import.meta.env.VITE_PUBLIC_API_URL}/ai/v2/sql-chat`,
      credentials: 'include',
      body: async () => ({
        type: database.type,
        currentQuery: pageStore.state.query,
        context: await queryClient.ensureQueryData(tablesAndSchemasQuery(database)),
      }),
    }),
    messages,
    onToolCall: async ({ toolCall }) => {
      if (toolCall.toolName === 'columns') {
        const input = toolCall.input as InferToolInput<typeof tools.columns>

        chat.addToolResult({
          tool: 'columns',
          toolCallId: toolCall.toolCallId,
          output: await queryClient.fetchQuery(databaseTableColumnsQuery(
            database,
            input.tableName,
            input.schemaName,
          )),
        })
      }
      else if (toolCall.toolName === 'enums') {
        chat.addToolResult({
          tool: 'enums',
          toolCallId: toolCall.toolCallId,
          output: await queryClient.fetchQuery(databaseEnumsQuery(database)).then(results => results.flatMap(r => r.values.map(v => ({
            schema: r.schema,
            name: r.name,
            value: v,
          })))),
        })
      }
      else if (toolCall.toolName === 'select') {
        const input = toolCall.input as InferToolInput<typeof tools.select>

        chat.addToolResult({
          tool: 'select',
          toolCallId: toolCall.toolCallId,
          output: await dbQuery({
            type: database.type,
            connectionString: database.connectionString,
            query: rowsSql(input.schemaName, input.tableName, {
              limit: input.limit,
              offset: input.offset,
              orderBy: input.orderBy,
              select: input.select,
              where: whereSql(input.whereFilters, input.whereConcatOperator)[database.type],
            })[database.type],
          }).then(results => results.map(r => r.rows).flat()),
        })
      }
    },
  }))

  return (
    <ChatProvider chat={chat}>
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
    </ChatProvider>
  )
}
