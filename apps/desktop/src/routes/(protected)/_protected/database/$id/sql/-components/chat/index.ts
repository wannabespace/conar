import type { AppUIMessage, tools } from '@conar/api/src/ai-tools'
import type { InferToolInput, InferToolOutput } from 'ai'
import type { chatsMessages, databases } from '~/drizzle'
import { Chat } from '@ai-sdk/react'
import { SQL_FILTERS_LIST } from '@conar/shared/filters/sql'
import { eventIteratorToStream } from '@orpc/client'
import { encode } from '@toon-format/toon'
import { lastAssistantMessageIsCompleteWithToolCalls } from 'ai'
import { v7 as uuid } from 'uuid'
import { chatsCollection, chatsMessagesCollection } from '~/entities/chat'
import { databaseEnumsQuery, databaseTableColumnsQuery, databaseTablesAndSchemasQuery } from '~/entities/database/queries'
import { rowsQuery } from '~/entities/database/sql/rows'
import { databaseStore } from '~/entities/database/store'
import { convertToAppUIMessage } from '~/lib/ai'
import { orpc } from '~/lib/orpc'
import { queryClient } from '~/main'

export * from './chat'

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

        const store = databaseStore(database.id)

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
            `Current query in the SQL runner:
            \`\`\`sql
            ${store.state.sql.trim() || '-- empty'}
            \`\`\`
            `,
            'Database schemas and tables:',
            encode(await queryClient.ensureQueryData(databaseTablesAndSchemasQuery({ database }))),
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

        chat.addToolOutput({
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

        chat.addToolOutput({
          tool: 'enums',
          toolCallId: toolCall.toolCallId,
          output,
        })
      }
      else if (toolCall.toolName === 'select') {
        const input = toolCall.input as InferToolInput<typeof tools.select>
        const output = await rowsQuery.run(database, {
          schema: input.tableAndSchema.schemaName,
          table: input.tableAndSchema.tableName,
          limit: input.limit,
          offset: input.offset,
          orderBy: input.orderBy,
          select: input.select,
          // To save back compatibility with the old filters
          filters: input.whereFilters.map((filter) => {
            const operator = SQL_FILTERS_LIST.find(f => f.operator === filter.operator)

            if (!operator) {
              throw new Error(`Invalid operator: ${filter.operator}`)
            }

            return {
              column: filter.column,
              ref: operator,
              values: filter.values,
            }
          }),
          filtersConcatOperator: input.whereConcatOperator,
        }).catch(error => ({
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
