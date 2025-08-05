import type { AppUIMessage, tools } from '@conar/shared/ai'
import type { InferToolInput, InferToolOutput } from 'ai'
import type { databases } from '~/drizzle'
import { Chat } from '@ai-sdk/react'
import { rowsSql } from '@conar/shared/sql/rows'
import { whereSql } from '@conar/shared/sql/where'
import { eventIteratorToStream } from '@orpc/client'
import { lastAssistantMessageIsCompleteWithToolCalls } from 'ai'
import { asc, eq } from 'drizzle-orm'
import { v7 as uuid } from 'uuid'
import { chats, chatsMessages, db } from '~/drizzle'
import { databaseEnumsQuery, databaseTableColumnsQuery, tablesAndSchemasQuery } from '~/entities/database'
import { orpc } from '~/lib/orpc'
import { dbQuery } from '~/lib/query'
import { queryClient } from '~/main'
import { pageStore } from './-lib'

export const chatQuery = {
  get(id: string) {
    return localStorage.getItem(`sql-${id}`) || '-- Write your SQL query here\n'
      + '\n'
      + '-- Please write your own queries based on your database schema\n'
      + '-- The examples below are for reference only and may not work with your database\n'
      + '\n'
      + '-- Example 1: Basic query with limit\n'
      + '-- SELECT * FROM users LIMIT 10;\n'
      + '\n'
      + '-- Example 2: Query with filtering\n'
      + '-- SELECT id, name, email FROM users WHERE created_at > \'2025-01-01\' ORDER BY name;\n'
      + '\n'
      + '-- Example 3: Join example\n'
      + '-- SELECT u.id, u.name, p.title FROM users u\n'
      + '-- JOIN posts p ON u.id = p.user_id\n'
      + '-- WHERE p.published = true\n'
      + '-- LIMIT 10;\n'
      + '\n'
      + '-- TIP: You can run multiple queries at once by separating them with semicolons'
  },
  set(id: string, query: string) {
    localStorage.setItem(`sql-${id}`, query)
  },
}

export const chatInput = {
  get(id: string) {
    const data = JSON.parse(sessionStorage.getItem(`sql-chat-input-${id}`) || '""')

    return typeof data === 'string' ? data : ''
  },
  set(id: string, input: string) {
    sessionStorage.setItem(`sql-chat-input-${id}`, JSON.stringify(input))
  },
}

export const lastOpenedChatId = {
  get() {
    return sessionStorage.getItem('sql-last-chat-id')
  },
  set(id: string | null) {
    if (id) {
      sessionStorage.setItem('sql-last-chat-id', id)
    }
    else {
      sessionStorage.removeItem('sql-last-chat-id')
    }
  },
}

const chatsMap = new Map<string, Chat<AppUIMessage>>()

export async function createChat({ id = uuid(), database }: { id?: string, database: typeof databases.$inferSelect }) {
  if (chatsMap.has(id)) {
    return chatsMap.get(id)!
  }

  const chat = new Chat<AppUIMessage>({
    id,
    generateId: uuid,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    transport: {
      async sendMessages(options) {
        const lastMessage = options.messages.at(-1)

        if (!lastMessage) {
          throw new Error('Last message not found')
        }

        await db.transaction(async (tx) => {
          // To ensure that the chat is created
          await tx.insert(chats).values({ id: options.chatId, databaseId: database.id }).onConflictDoNothing()

          if (options.trigger === 'submit-message') {
            await tx.insert(chatsMessages).values({
              ...lastMessage,
              chatId: options.chatId,
            }).onConflictDoUpdate({ // It happens when the chat calling the stream again after some tool call
              target: chatsMessages.id,
              set: lastMessage,
            })
          }

          if (options.trigger === 'regenerate-message' && options.messageId) {
            await tx.delete(chatsMessages).where(eq(chatsMessages.id, options.messageId))
          }
        })

        return eventIteratorToStream(await orpc.ai.ask({
          ...options.body,
          id: options.chatId,
          type: database.type,
          databaseId: database.id,
          prompt: lastMessage,
          trigger: options.trigger,
          messageId: options.messageId,
          context: `Current query in the SQL runner: ${pageStore.state.query}
          Database schemas and tables: ${JSON.stringify(await queryClient.ensureQueryData(tablesAndSchemasQuery(database)), null, 2)}`,
        }, { signal: options.abortSignal }))
      },
      reconnectToStream() {
        throw new Error('Unsupported')
      },
    },
    messages: await db.select().from(chatsMessages).where(eq(chatsMessages.chatId, id)).orderBy(asc(chatsMessages.createdAt)).then(rows => rows.map(row => ({
      ...row,
      metadata: row.metadata || undefined,
    }))) satisfies AppUIMessage[],
    onFinish: async ({ message }) => {
      await db.insert(chatsMessages).values({ chatId: id, ...message }).onConflictDoUpdate({ // It happens when the chat calling the stream again after some tool call
        target: chatsMessages.id,
        set: message,
      })
    },
    onToolCall: async ({ toolCall }) => {
      if (toolCall.toolName === 'columns') {
        const input = toolCall.input as InferToolInput<typeof tools.columns>
        const output = await queryClient.ensureQueryData(databaseTableColumnsQuery(
          database,
          input.tableAndSchema.tableName,
          input.tableAndSchema.schemaName,
        )) satisfies InferToolOutput<typeof tools.columns>

        chat.addToolResult({
          tool: 'columns',
          toolCallId: toolCall.toolCallId,
          output,
        })
      }
      else if (toolCall.toolName === 'enums') {
        const output = await queryClient.ensureQueryData(databaseEnumsQuery(database)).then(results => results.flatMap(r => r.values.map(v => ({
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
          query: rowsSql(input.tableAndSchema.schemaName, input.tableAndSchema.tableName, {
            limit: input.limit,
            offset: input.offset,
            orderBy: input.orderBy,
            select: input.select,
            where: whereSql(input.whereFilters, input.whereConcatOperator)[database.type],
          })[database.type],
        })
          .then(results => results.map(r => r.rows).flat())
          .catch(error => ({
            error: error instanceof Error ? error.message : 'Error during the query execution',
          })) satisfies InferToolOutput<typeof tools.select>

        chat.addToolResult({
          tool: 'select',
          toolCallId: toolCall.toolCallId,
          output,
        })
      }
    },
  })

  chatsMap.set(id, chat)

  return chat
}
