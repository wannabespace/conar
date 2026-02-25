import type { tools } from '@conar/api/ai/tools'
import type { AppUIMessage } from '@conar/api/ai/tools/helpers'
import type { InferToolInput, InferToolOutput } from 'ai'
import type { chatsMessages, connectionsResources } from '~/drizzle'
import { Chat } from '@ai-sdk/react'
import { SQL_FILTERS_LIST } from '@conar/shared/filters'
import { eventIteratorToStream } from '@orpc/client'
import { encode } from '@toon-format/toon'
import { lastAssistantMessageIsCompleteWithToolCalls } from 'ai'
import { v7 as uuid } from 'uuid'
import { chatsCollection, chatsMessagesCollection } from '~/entities/chat/sync'
import { resourceEnumsQuery, resourceTableColumnsQuery, resourceTablesAndSchemasQuery, rowsQuery } from '~/entities/connection/queries'
import { connectionResourceToQueryParams } from '~/entities/connection/query'
import { connectionResourceStore } from '~/entities/connection/store'
import { connectionsCollection } from '~/entities/connection/sync'
import { convertToAppUIMessage } from '~/lib/ai'
import { orpc } from '~/lib/orpc'
import { queryClient } from '~/main'

export * from './chat'

async function ensureChat(chatId: string, connectionResourceId: string) {
  const existingChat = chatsCollection.get(chatId)

  if (existingChat) {
    return existingChat
  }

  await chatsCollection.insert({
    id: chatId,
    connectionId: connectionResourceId,
    title: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).isPersisted.promise

  return chatsCollection.get(chatId)!
}

const chatsMap = new Map<string, Chat<AppUIMessage>>()

export async function createChat({ id = uuid(), connectionResource }: { id?: string, connectionResource: typeof connectionsResources.$inferSelect }) {
  if (chatsMap.has(id)) {
    return chatsMap.get(id)!
  }

  const connection = connectionsCollection.get(connectionResource.connectionId)!

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

        const chat = await ensureChat(options.chatId, connectionResource.id)

        const existingMessage = chatsMessagesCollection.get(lastMessage.id)

        if (existingMessage) {
          await chatsMessagesCollection.update(lastMessage.id, (draft) => {
            Object.assign(draft, {
              ...lastMessage,
              chatId: options.chatId,
              metadata: existingMessage.metadata,
            } satisfies typeof chatsMessages.$inferInsert)
          }).isPersisted.promise
        }
        else {
          const updatedAt = new Date()
          const createdAt = new Date()
          await chatsMessagesCollection.insert({
            ...lastMessage,
            chatId: options.chatId,
            createdAt,
            updatedAt,
            metadata: {
              createdAt,
              updatedAt,
            },
          }).isPersisted.promise
        }

        if (options.trigger === 'regenerate-message' && options.messageId && chatsMessagesCollection.has(options.messageId)) {
          await chatsMessagesCollection.delete(options.messageId).isPersisted.promise
        }

        const store = connectionResourceStore(connectionResource.id)

        return eventIteratorToStream(await orpc.ai.chat({
          id: options.chatId,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
          type: connection.type,
          messages: options.messages,
          context: [
            `Current query in the SQL runner:
            \`\`\`sql
            ${store.state.query.trim() || '-- empty'}
            \`\`\`
            `,
            'Database schemas and tables:',
            encode(await queryClient.ensureQueryData(resourceTablesAndSchemasQuery({ connectionResource, showSystem: store.state.showSystem }))),
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
            id: message.id,
            parts: message.parts,
            role: message.role,
            chatId: id,
            metadata: existingMessage.metadata,
            createdAt: message.metadata?.createdAt || new Date(),
            updatedAt: message.metadata?.updatedAt || new Date(),
          } satisfies typeof draft)
        })
      }
      else {
        chatsMessagesCollection.insert({
          id: message.id,
          chatId: id,
          createdAt: message.metadata?.createdAt || new Date(),
          updatedAt: message.metadata?.updatedAt || new Date(),
          metadata: null,
          parts: message.parts,
          role: message.role,
        })
      }
    },
    onToolCall: async ({ toolCall }) => {
      if (toolCall.toolName === 'columns') {
        const input = toolCall.input as InferToolInput<typeof tools.columns>
        const output = await queryClient.ensureQueryData(resourceTableColumnsQuery({
          connectionResource,
          table: input.tableAndSchema.tableName,
          schema: input.tableAndSchema.schemaName,
        })) satisfies InferToolOutput<typeof tools.columns>

        chat.addToolOutput({
          tool: 'columns',
          toolCallId: toolCall.toolCallId,
          output,
        })
      }
      else if (toolCall.toolName === 'enums') {
        const output = await queryClient.ensureQueryData(resourceEnumsQuery({ connectionResource })).then(results => results.flatMap(r => r.values.map(v => ({
          schema: r.schema,
          name: r.name,
          value: v,
        })))) satisfies InferToolOutput<typeof tools.enums>

        chat.addToolOutput({
          tool: 'enums',
          toolCallId: toolCall.toolCallId,
          output,
        })
      }
      else if (toolCall.toolName === 'select') {
        const input = toolCall.input as InferToolInput<typeof tools.select>
        const output = await rowsQuery({
          schema: input.tableAndSchema.schemaName,
          table: input.tableAndSchema.tableName,
          limit: input.limit,
          offset: input.offset,
          query: {
            orderBy: input.orderBy ?? undefined,
            filters: input.whereFilters.map((filter) => {
              const ref = SQL_FILTERS_LIST.find(f => f.operator === filter.operator)

              if (!ref) {
                throw new Error(`Invalid operator: ${filter.operator}`)
              }

              return {
                ref,
                column: filter.column,
                values: filter.values,
              }
            }),
            filtersConcatOperator: input.whereConcatOperator,
          },
          select: input.select ?? undefined,
        })
          .run(connectionResourceToQueryParams(connectionResource))
          .catch(error => ({
            error: error instanceof Error ? error.message : 'Error during the query execution',
          })) satisfies InferToolOutput<typeof tools.select>

        chat.addToolOutput({
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
