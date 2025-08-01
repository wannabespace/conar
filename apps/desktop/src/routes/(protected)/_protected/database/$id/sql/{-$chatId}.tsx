import type { AppUIMessage, tools } from '@conar/shared/ai'
import type { InferToolInput, InferToolOutput } from 'ai'
import type { databases } from '~/drizzle'
import { Chat, useChat } from '@ai-sdk/react'
import { rowsSql } from '@conar/shared/sql/rows'
import { whereSql } from '@conar/shared/sql/where'
import { title } from '@conar/shared/utils/title'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@conar/ui/components/resizable'
import { useMountedEffect } from '@conar/ui/hookas/use-mounted-effect'
import { eventIteratorToStream } from '@orpc/client'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { lastAssistantMessageIsCompleteWithToolCalls } from 'ai'
import { useState } from 'react'
import { v7 as uuid } from 'uuid'
import { chats, chatsMessages, db } from '~/drizzle'
import { databaseEnumsQuery, databaseTableColumnsQuery, tablesAndSchemasQuery } from '~/entities/database'
import { orpc } from '~/lib/orpc'
import { dbQuery } from '~/lib/query'
import { queryClient } from '~/main'
import { chatMessages, chatQuery, lastOpenedChatId } from './-chat'
import { Chat as ChatComponent } from './-components/chat'
import { ChatProvider } from './-components/chat-provider'
import { Runner } from './-components/runner'
import { pageStore } from './-lib'

export const Route = createFileRoute(
  '/(protected)/_protected/database/$id/sql/{-$chatId}',
)({
  component: DatabaseSqlPage,
  loader: async ({ params, context }) => {
    const lastId = lastOpenedChatId.get()

    if (!params.chatId && lastId && lastId !== params.chatId) {
      throw redirect({ to: '/database/$id/sql/{-$chatId}', params: { id: params.id, chatId: lastId }, replace: true })
    }

    lastOpenedChatId.set(params.chatId || null)

    pageStore.setState(state => ({
      ...state,
      query: chatQuery.get(params.id),
    }))

    return {
      database: context.database,
      messages: params.chatId ? await chatMessages.get(params.chatId) : [],
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

function createChat({ id, database, messages }: { id: string | undefined, database: typeof databases.$inferSelect, messages: AppUIMessage[] }) {
  const chat = new Chat({
    id,
    generateId: uuid,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    transport: {
      async sendMessages(options) {
        const lastMessage = options.messages.at(-1)

        if (!lastMessage) {
          throw new Error('User message not found')
        }

        await db.transaction(async (tx) => {
          await Promise.all([
            tx.insert(chats).values({ id: options.chatId, databaseId: database.id }).onConflictDoNothing(),
            tx.insert(chatsMessages).values({
              ...lastMessage,
              chatId: options.chatId,
            }).onConflictDoUpdate({ // If regenerating, update the message
              target: [chatsMessages.id],
              set: lastMessage,
            }),
          ])
        })

        return eventIteratorToStream(await orpc.ai.sqlChat({
          id: options.chatId,
          type: database.type,
          currentQuery: pageStore.state.query,
          context: (await queryClient.ensureQueryData(tablesAndSchemasQuery(database))).schemas,
          databaseId: database.id,
          prompt: lastMessage,
        }, { signal: options.abortSignal }))
      },
      reconnectToStream() {
        throw new Error('Unsupported')
      },
    },
    messages,
    onFinish: async ({ message }) => {
      await chatMessages.set(chat.id, message)
    },
    onToolCall: async ({ toolCall }) => {
      if (toolCall.toolName === 'columns') {
        const input = toolCall.input as InferToolInput<typeof tools.columns>
        const output = await queryClient.fetchQuery(databaseTableColumnsQuery(
          database,
          input.tableName,
          input.schemaName,
        )) satisfies InferToolOutput<typeof tools.columns>

        chat.addToolResult({
          tool: 'columns',
          toolCallId: toolCall.toolCallId,
          output,
        })
      }
      else if (toolCall.toolName === 'enums') {
        const output = await queryClient.fetchQuery(databaseEnumsQuery(database)).then(results => results.flatMap(r => r.values.map(v => ({
          schema: r.schema,
          name: r.name,
          value: v,
        })))) satisfies InferToolOutput<typeof tools.enums>

        chat.addToolResult({
          tool: 'enums',
          toolCallId: toolCall.toolCallId,
          output,
        })
      }
      else if (toolCall.toolName === 'select') {
        const input = toolCall.input as InferToolInput<typeof tools.select>
        const output = await dbQuery({
          type: database.type,
          connectionString: database.connectionString,
          query: rowsSql(input.schemaName, input.tableName, {
            limit: input.limit,
            offset: input.offset,
            orderBy: input.orderBy,
            select: input.select,
            where: whereSql(input.whereFilters, input.whereConcatOperator)[database.type],
          })[database.type],
        }).then(results => results.map(r => r.rows).flat()) satisfies InferToolOutput<typeof tools.select>

        chat.addToolResult({
          tool: 'select',
          toolCallId: toolCall.toolCallId,
          output,
        })
      }
    },
  })

  if (chat.messages.at(-1)?.role === 'user') {
    chat.regenerate()
  }

  return chat
}

function DatabaseSqlPage() {
  const router = useRouter()
  const { chatId } = Route.useParams()
  const { messages, database } = Route.useLoaderData()
  const [chat] = useState(() => createChat({ id: chatId, database, messages }))
  const { id, status } = useChat({ chat })

  useMountedEffect(() => {
    if (!chatId && status === 'submitted' && chatId !== id) {
      router.navigate({ to: '/database/$id/sql/{-$chatId}', params: { id: database.id, chatId: id }, replace: true })
    }
  }, [id, chatId, database.id, router, status])

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
