import { Chat } from '@ai-sdk/react'
import type { AITools } from '@conar/ai/tools'
import type { AppUIMessage } from '@conar/ai/tools/helpers'
import { convertToAppUIMessage } from '@conar/ai/tools/helpers'
import { SQL_FILTERS_LIST } from '@conar/shared/filters'
import { eventIteratorToStream } from '@orpc/client'
import { eq, queryOnce } from '@tanstack/react-db'
import { lastAssistantMessageIsCompleteWithToolCalls } from 'ai'
import { memoize } from 'memoza'
import { v7 as uuid } from 'uuid'

import { createChatMessageAction } from '~/entities/chat/sync'
import { getCollections } from '~/entities/collections'
import type { ConnectionResource } from '~/entities/connection/core'
import {
  resourceEnumsQueryOptions,
  resourceRowsQuery,
  resourceTableColumnsQueryOptions,
  resourceTablesAndSchemasQueryOptions,
} from '~/entities/connection/queries'
import { connectionResourceToQueryParams } from '~/entities/connection/runtime'
import { getConnectionResourceStore } from '~/entities/connection/store'
import { orpc } from '~/lib/orpc'
import { queryClient } from '~/main'

export * from './chat'

export const createChat = memoize(
  async ({ id, connectionResource }: { id: string; connectionResource: ConnectionResource }) => {
    const { connectionsCollection, chatsCollection, chatsMessagesCollection } = getCollections()
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

          const existingMessage = chatsMessagesCollection.get(lastMessage.id)

          if (existingMessage) {
            const hasChanges =
              lastMessage.role !== existingMessage.role ||
              JSON.stringify(lastMessage.parts) !== JSON.stringify(existingMessage.parts)

            if (hasChanges) {
              const updatedAt = lastMessage.metadata?.updatedAt || new Date()
              await chatsMessagesCollection.update(lastMessage.id, (draft) => {
                draft.parts = lastMessage.parts
                draft.role = lastMessage.role
                draft.updatedAt = updatedAt
              }).isPersisted.promise
            }
          } else {
            const createdAt = new Date()
            const updatedAt = new Date()

            const tx = createChatMessageAction({
              chat: {
                id: options.chatId,
                connectionResourceId: connectionResource.id,
                title: null,
                createdAt,
                updatedAt,
              },
              message: {
                ...lastMessage,
                chatId: options.chatId,
                createdAt,
                updatedAt,
                metadata: {
                  createdAt,
                  updatedAt,
                },
              },
            })

            await tx.isPersisted.promise
          }

          if (
            options.trigger === 'regenerate-message' &&
            options.messageId &&
            chatsMessagesCollection.has(options.messageId)
          ) {
            await chatsMessagesCollection.delete(options.messageId).isPersisted.promise
          }

          const chat = chatsCollection.get(options.chatId)!
          const store = getConnectionResourceStore(connectionResource.id)

          return eventIteratorToStream(
            await orpc.ai.chat.call(
              {
                id: options.chatId,
                createdAt: chat.createdAt,
                updatedAt: chat.updatedAt,
                type: connection.type,
                messages: options.messages,
                context: [
                  `Current query in the SQL runner:
            \`\`\`sql
            ${store.get().query.trim() || '-- empty'}
            \`\`\`
            `,
                  'Database schemas and tables:',
                  JSON.stringify(
                    await queryClient.ensureQueryData(
                      resourceTablesAndSchemasQueryOptions({
                        connectionResource,
                        showSystem: store.get().showSystem,
                      }),
                    ),
                    null,
                    2,
                  ),
                ].join('\n'),
              },
              { signal: options.abortSignal },
            ),
          )
        },
        reconnectToStream() {
          throw new Error('Unsupported')
        },
      },
      messages: await queryOnce((q) =>
        q
          .from({ chatsMessages: chatsMessagesCollection })
          .where(({ chatsMessages }) => eq(chatsMessages.chatId, id))
          .orderBy(({ chatsMessages }) => chatsMessages.createdAt, 'asc'),
      ).then((results) => results.map(convertToAppUIMessage)),
      onFinish: ({ message }) => {
        const existingMessage = chatsMessagesCollection.get(message.id)

        if (existingMessage) {
          const hasChanges =
            message.role !== existingMessage.role ||
            JSON.stringify(message.parts) !== JSON.stringify(existingMessage.parts)

          if (hasChanges) {
            chatsMessagesCollection.update(message.id, (draft) => {
              draft.parts = message.parts
              draft.role = message.role
              if (message.metadata?.createdAt) {
                draft.createdAt = message.metadata?.createdAt
              }
              if (message.metadata?.updatedAt) {
                draft.updatedAt = message.metadata?.updatedAt
              }
            })
          }
        } else {
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
          const input = toolCall.input as AITools['columns']['input']
          const output = (await queryClient.ensureQueryData(
            resourceTableColumnsQueryOptions({
              connectionResource,
              table: input.tableAndSchema.tableName,
              schema: input.tableAndSchema.schemaName,
            }),
          )) satisfies AITools['columns']['output']

          chat.addToolOutput({
            tool: 'columns',
            toolCallId: toolCall.toolCallId,
            output,
          })
        } else if (toolCall.toolName === 'enums') {
          const output = (await queryClient
            .ensureQueryData(resourceEnumsQueryOptions({ connectionResource }))
            .then((results) =>
              results.flatMap((r) =>
                r.values.map((v) => ({
                  schema: r.schema,
                  name: r.name,
                  value: v,
                })),
              ),
            )) satisfies AITools['enums']['output']

          chat.addToolOutput({
            tool: 'enums',
            toolCallId: toolCall.toolCallId,
            output,
          })
        } else if (toolCall.toolName === 'select') {
          const input = toolCall.input as AITools['select']['input']
          const output = (await resourceRowsQuery({
            schema: input.tableAndSchema.schemaName,
            table: input.tableAndSchema.tableName,
            limit: input.limit,
            offset: input.offset,
            query: {
              orderBy: input.orderBy ?? undefined,
              filters: input.whereFilters.map((filter) => {
                const ref = SQL_FILTERS_LIST.find((f) => f.operator === filter.operator)

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
            .run(await connectionResourceToQueryParams(connectionResource))
            .catch((error) => ({
              error: error instanceof Error ? error.message : 'Error during the query execution',
            }))) satisfies AITools['select']['output']

          chat.addToolOutput({
            tool: 'select',
            toolCallId: toolCall.toolCallId,
            output,
          })
        }
      },
    })

    return chat
  },
  {
    cacheKey: ({ id, connectionResource }) => `${id}-${connectionResource.id}`,
  },
)
