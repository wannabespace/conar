import type { AppUIMessage, tools } from '@conar/shared/ai-tools'
import type { InferToolInput, InferToolOutput } from 'ai'
import type { chatsMessages, databases } from '~/drizzle'
import { Chat } from '@ai-sdk/react'
import { convertToAppUIMessage } from '@conar/shared/ai-tools'
import { rowsSql } from '@conar/shared/sql/rows'
import { whereSql } from '@conar/shared/sql/where'
import { sessionStorageValue, useSessionStorage } from '@conar/ui/hookas/use-session-storage'
import { eventIteratorToStream } from '@orpc/client'
import { lastAssistantMessageIsCompleteWithToolCalls } from 'ai'
import { v7 as uuid } from 'uuid'
import { chatsCollection, chatsMessagesCollection } from '~/entities/chat'
import { databaseEnumsQuery, databaseTableColumnsQuery, tablesAndSchemasQuery } from '~/entities/database'
import { orpc } from '~/lib/orpc'
import { dbQuery } from '~/lib/query'
import { queryClient } from '~/main'
import { pageStore } from './-lib'

export const chatQuery = {
  get(id: string) {
    return localStorage.getItem(`sql-${id}`) || [
      '-- Write your SQL query here',
      '',
      '-- Please write your own queries based on your database schema',
      '-- The examples below are for reference only and may not work with your database',
      '',
      '-- Example 1: Basic query with limit',
      '-- SELECT * FROM users LIMIT 10;',
      '',
      '-- Example 2: Query with filtering',
      '-- SELECT id, name, email FROM users WHERE created_at > \'2025-01-01\' ORDER BY name;',
      '',
      '-- Example 3: Join example',
      '-- SELECT u.id, u.name, p.title FROM users u',
      '-- JOIN posts p ON u.id = p.user_id',
      '-- WHERE p.published = true',
      '-- LIMIT 10;',
      '',
      '-- TIP: You can run multiple queries at once by separating them with semicolons',
    ].join('\n')
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

function getLastChatIdKey(databaseId: string) {
  return `sql-last-chat-id-${databaseId}`
}

export function useLastOpenedChatId(databaseId: string) {
  return useSessionStorage<string | null>(getLastChatIdKey(databaseId), null)
}

export const lastOpenedChatId = {
  get(databaseId: string) {
    return sessionStorageValue<string | null>(getLastChatIdKey(databaseId), null).get()
  },
  set(databaseId: string, id: string | null) {
    const value = sessionStorageValue<string | null>(getLastChatIdKey(databaseId), null)

    if (id) {
      value.set(id)
    }
    else {
      value.remove()
    }
  },
}

function ensureChat(chatId: string, databaseId: string) {
  const existingChat = chatsCollection.get(chatId)

  if (existingChat) {
    return existingChat
  }

  chatsCollection.insert({
    id: chatId,
    databaseId,
    title: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return chatsCollection.get(chatId)!
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

        if (options.trigger === 'regenerate-message' && !options.messageId) {
          options.messageId = lastMessage.id
        }

        const chat = ensureChat(options.chatId, database.id)

        if (options.trigger === 'submit-message') {
          const existingMessage = chatsMessagesCollection.get(lastMessage.id)

          const updatedAt = new Date()
          if (existingMessage) {
            chatsMessagesCollection.update(lastMessage.id, (draft) => {
              Object.assign(draft, {
                ...lastMessage,
                chatId: options.chatId,
                updatedAt,
                metadata: {
                  ...existingMessage.metadata,
                  updatedAt,
                },
              } satisfies typeof chatsMessages.$inferInsert)
            })
          }
          else {
            const createdAt = new Date()
            chatsMessagesCollection.insert({
              ...lastMessage,
              chatId: options.chatId,
              createdAt,
              updatedAt,
              metadata: {
                createdAt,
                updatedAt,
              },
            })
          }
        }

        if (options.trigger === 'regenerate-message' && options.messageId) {
          chatsMessagesCollection.delete(options.messageId)
        }

        return eventIteratorToStream(await orpc.ai.ask({
          ...options.body,
          id: options.chatId,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
          type: database.type,
          databaseId: database.id,
          prompt: lastMessage,
          trigger: options.trigger,
          messageId: options.messageId,
          context: [
            `Current query in the SQL runner: ${pageStore.state.query.trim() || 'Empty'}`,
            'Database schemas and tables:',
            JSON.stringify(await queryClient.ensureQueryData(tablesAndSchemasQuery({ database })), null, 2),
          ].join('\n'),
        }, { signal: options.abortSignal }))
      },
      reconnectToStream() {
        throw new Error('Unsupported')
      },
    },
    messages: (await chatsMessagesCollection.toArrayWhenReady())
      .filter(m => m.chatId === id)
      .toSorted((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map(convertToAppUIMessage),
    onFinish: ({ message }) => {
      const existingMessage = chatsMessagesCollection.get(message.id)

      if (existingMessage) {
        chatsMessagesCollection.update(message.id, (draft) => {
          Object.assign(draft, {
            ...message,
            createdAt: message.metadata?.createdAt || new Date(),
            updatedAt: message.metadata?.updatedAt || new Date(),
          })
        })
      }
      else {
        chatsMessagesCollection.insert({
          ...message,
          chatId: id,
          createdAt: message.metadata?.createdAt || new Date(),
          updatedAt: message.metadata?.updatedAt || new Date(),
          metadata: null,
        })
      }
    },
    onToolCall: async ({ toolCall }) => {
      if (toolCall.toolName === 'columns') {
        const input = toolCall.input as InferToolInput<typeof tools.columns>
        const output = await queryClient.ensureQueryData(databaseTableColumnsQuery({
          database,
          table: input.tableAndSchema.tableName,
          schema: input.tableAndSchema.schemaName,
        })) satisfies InferToolOutput<typeof tools.columns>

        chat.addToolResult({
          tool: 'columns',
          toolCallId: toolCall.toolCallId,
          output,
        })
      }
      else if (toolCall.toolName === 'enums') {
        const output = await queryClient.ensureQueryData(databaseEnumsQuery({ database })).then(results => results.flatMap(r => r.values.map(v => ({
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
        const output = await dbQuery(database.id, {
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
