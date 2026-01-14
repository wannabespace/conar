import type { LanguageModelV3 } from '@ai-sdk/provider'
import type { AppUIMessage } from '~/ai-tools'
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { DatabaseType } from '@conar/shared/enums/database-type'
import { ORPCError, streamToEventIterator } from '@orpc/server'
import { convertToModelMessages, smoothStream, stepCountIs, streamText } from 'ai'
import { createRetryable } from 'ai-retry'
import { type } from 'arktype'
import { consola } from 'consola'
import { asc, eq } from 'drizzle-orm'
import { v7 } from 'uuid'
import { convertToAppUIMessage, tools } from '~/ai-tools'
import { chats, chatsMessages, db } from '~/drizzle'
import { withPosthog } from '~/lib/posthog'
import { orpc, requireSubscriptionMiddleware } from '~/orpc'

const chatInputType = type({
  'id': 'string.uuid.v7',
  'type': type.valueOf(DatabaseType),
  'context?': 'string',
  'createdAt?': 'Date',
  'updatedAt?': 'Date',
  'prompt': 'object' as type.cast<AppUIMessage>,
  'databaseId': 'string.uuid.v7',
  'fallback?': 'boolean',
  'trigger': '"submit-message" | "regenerate-message"',
  'messageId?': 'string.uuid.v7',
})

const mainModel = createRetryable({
  model: anthropic('claude-sonnet-4-5'),
  retries: [
    anthropic('claude-opus-4-5'),
    google('gemini-2.5-pro'),
  ],
})

const fallbackModel = anthropic('claude-opus-4-1')

function handleError(error: unknown) {
  if (typeof error === 'object' && (error as { type?: string }).type === 'overloaded_error') {
    return 'Sorry, I was unable to generate a response due to high load. Please try again later.'
  }
  if (typeof error === 'object' && (error as { message?: string }).message?.includes('prompt is too long')) {
    return 'Sorry, I was unable to generate a response. Currently I cannot handle larger chats like yours. Please create a new chat.'
  }
  return 'Sorry, I was unable to generate a response due to an error. Please try again.'
}

async function generateStream({
  messages,
  type,
  context,
  model,
  signal,
  chatId,
  userId,
}: {
  messages: AppUIMessage[]
  type: typeof chatInputType.infer['type']
  context: typeof chatInputType.infer['context']
  model: Exclude<LanguageModelV3, string>
  signal?: AbortSignal
  chatId: string
  userId: string
}) {
  consola.info('messages', JSON.stringify(messages.map(message => ({
    id: message.id,
    chatId,
    role: message.role,
    partsCount: message.parts.length,
  })), null, 2))

  const modelMessages = await convertToModelMessages(messages)

  return streamText({
    messages: [
      {
        role: 'system',
        content: [
          `You are an SQL tool that generates valid SQL code for ${type} database.`,
          'You can use several tools to improve response.',
          'You can generate select queries using the tools to get data directly from the database.',
          'You can also search the web for information when the user asks about external resources, provides URLs, or needs current information beyond the database schema.',
          '',
          'Requirements:',
          `- Ensure the SQL is 100% valid and optimized for ${type} database`,
          '- Use proper table and column names exactly as provided in the context',
          '- Use 2 spaces for indentation and consistent formatting',
          '- Consider performance implications for complex queries',
          '- The SQL code will be executed directly in a production database editor',
          '- Generate SQL query only for the provided schemas, tables, columns and enums',
          '- Answer in markdown and paste the SQL code in a code block, each query in a separate code block, do not use headings',
          '- Answer in the same language as the user\'s message',
          '- Use quotes for table and column names to prevent SQL errors with case sensitivity',
          '- If a user asks to change specific lines generate SQL only for the lines, not for whole SQL',
          '',
          'Additional information:',
          `- Current date and time: ${new Date().toISOString()}`,
          '',
          'You can use the following tools to help you generate the SQL code:',
          Object.entries(tools).map(([tool, { description }]) => `- ${tool}: ${description}`).join('\n'),
          '',
          'User provided context:',
          context,
        ].join('\n'),
      },
      ...modelMessages,
    ],
    stopWhen: stepCountIs(20),
    abortSignal: signal,
    model: withPosthog(model, {
      chatId,
      userId,
    }),
    experimental_transform: smoothStream(),
    tools,
  })
}

export function getMessages(chatId: string): Promise<AppUIMessage[]> {
  return db
    .select()
    .from(chatsMessages)
    .where(eq(chatsMessages.chatId, chatId))
    .orderBy(asc(chatsMessages.createdAt))
    .then(rows => rows.map(convertToAppUIMessage))
}

async function ensureChat({
  chatId,
  userId,
  databaseId,
  createdAt,
  updatedAt,
}: {
  chatId: string
  userId: string
  databaseId: string
  createdAt?: Date
  updatedAt?: Date
}) {
  const [existingChat] = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1)

  if (existingChat) {
    return existingChat
  }

  const [newChat] = await db.insert(chats).values({
    id: chatId,
    userId,
    databaseId,
    createdAt,
    updatedAt,
  }).returning()

  return newChat
}

export const ask = orpc
  .use(requireSubscriptionMiddleware)
  .use(async ({ context, next }) => {
    context.setHeader('Transfer-Encoding', 'chunked')
    context.setHeader('Connection', 'keep-alive')

    return next()
  })
  .input(chatInputType)
  .handler(async ({ input, context, signal }) => {
    await ensureChat({
      chatId: input.id,
      userId: context.user.id,
      databaseId: input.databaseId,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
    })

    if (input.trigger === 'submit-message') {
      await db.insert(chatsMessages).values({
        chatId: input.id,
        ...input.prompt,
      }).onConflictDoUpdate({
        target: chatsMessages.id,
        set: input.prompt,
      }).catch((error) => {
        consola.error('error on submit-message', error)
        throw error
      })
    }

    if (input.trigger === 'regenerate-message' && input.messageId) {
      await db.delete(chatsMessages).where(eq(chatsMessages.id, input.messageId)).catch((error) => {
        consola.error('error on regenerate-message', error)
        throw error
      })
    }

    const messages = await getMessages(input.id).catch((error) => {
      consola.error('error on getMessages', error)
      throw error
    })

    try {
      const result = await generateStream({
        type: input.type,
        model: input.fallback ? fallbackModel : mainModel,
        context: input.context,
        messages,
        signal,
        chatId: input.id,
        userId: context.user.id,
      })

      const stream = result.toUIMessageStream({
        originalMessages: messages,
        generateMessageId: () => v7(),
        sendSources: true,
        messageMetadata: ({ part }) => {
          if (part.type === 'finish') {
            return {
              updatedAt: new Date(),
            }
          }
        },
        onFinish: async (result) => {
          consola.info('stream finished', JSON.stringify({
            ...result.responseMessage,
            parts: result.responseMessage.parts.map(part => part.type),
          }, null, 2))

          try {
            await db.insert(chatsMessages).values({
              ...result.responseMessage,
              updatedAt: result.responseMessage.metadata?.updatedAt,
              chatId: input.id,
            }).onConflictDoUpdate({
              target: chatsMessages.id,
              set: {
                ...result.responseMessage,
                updatedAt: result.responseMessage.metadata?.updatedAt,
              },
            })

            await db.update(chats).set({ activeStreamId: null }).where(eq(chats.id, input.id))
          }
          catch (error) {
            consola.error('error onFinish transaction', error)
            throw error
          }
        },
        onError: (error) => {
          consola.error('error toUIMessageStream onError', error)

          return handleError(error)
        },
      })

      return streamToEventIterator(stream)
    }
    catch (error) {
      consola.error('error on ask', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: error instanceof Error ? error.message : 'Sorry, I was unable to generate a response due to an error. Please try again.',
      })
    }
  })
