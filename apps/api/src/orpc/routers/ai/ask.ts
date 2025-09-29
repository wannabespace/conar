import type { AppUIMessage } from '@conar/shared/ai-tools'
import type { LanguageModel } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { convertToAppUIMessage, tools } from '@conar/shared/ai-tools'
import { DatabaseType } from '@conar/shared/enums/database-type'
import { ORPCError, streamToEventIterator } from '@orpc/server'
import { convertToModelMessages, smoothStream, stepCountIs, streamText } from 'ai'
import { type } from 'arktype'
import { asc, eq } from 'drizzle-orm'
// import { createResumableStreamContext } from 'resumable-stream'
import { v7 } from 'uuid'
import { chats, chatsMessages, db } from '~/drizzle'
import { withPosthog } from '~/lib/posthog'
import { authMiddleware, orpc } from '~/orpc'

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

const mainModel = anthropic('claude-sonnet-4-5')
const fallbackModel = anthropic('claude-opus-4-1')

// const streamContext = createResumableStreamContext({
//   waitUntil: null,
// })

function handleError(error: unknown) {
  if (typeof error === 'object' && (error as { type?: string }).type === 'overloaded_error') {
    return 'Sorry, I was unable to generate a response due to high load. Please try again later.'
  }
  if (typeof error === 'object' && (error as { message?: string }).message?.includes('prompt is too long')) {
    return 'Sorry, I was unable to generate a response. Currently I cannot handle larger chats like yours. Please create a new chat.'
  }
  return 'Sorry, I was unable to generate a response due to an error. Please try again.'
}

function generateStream({
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
  model: Exclude<LanguageModel, string>
  signal?: AbortSignal
  chatId: string
  userId: string
}) {
  console.info('messages', JSON.stringify(messages.map(message => ({
    id: message.id,
    chatId,
    role: message.role,
    partsCount: message.parts.length,
  })), null, 2))

  return streamText({
    messages: [
      {
        role: 'system',
        content: [
          `You are an SQL tool that generates valid SQL code for ${type} database.`,
          'You can use several tools to improve response.',
          'You can generate select queries using the tools to get data directly from the database.',
          '',
          'Requirements:',
          `- Ensure the SQL is 100% valid and optimized for ${type} database`,
          '- Use proper table and column names exactly as provided in the context',
          '- Use 2 spaces for indentation and consistent formatting',
          '- Consider performance implications for complex queries',
          '- The SQL code will be executed directly in a production database editor',
          '- Generate SQL query only for the provided schemas, tables, columns and enums',
          '- Answer in markdown and paste the SQL code in a code block, do not use headings',
          '- Answer in the same language as the user\'s message',
          '- Use quotes for table and column names to prevent SQL errors with case sensitivity',
          '',
          'Additional information:',
          `- Current date and time: ${new Date().toISOString()}`,
          '',
          'You can use the following tools to help you generate the SQL code:',
          `- ${Object.entries(tools).map(([tool, { description }]) => `${tool}: ${description}`).join('\n')}`,
          '',
          'User provided context:',
          context,
        ].join('\n'),
      },
      ...convertToModelMessages(messages),
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
  .use(authMiddleware)
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
        console.error('error on submit-message', error)
        throw error
      })
    }

    if (input.trigger === 'regenerate-message' && input.messageId) {
      await db.delete(chatsMessages).where(eq(chatsMessages.id, input.messageId)).catch((error) => {
        console.error('error on regenerate-message', error)
        throw error
      })
    }

    const messages = await getMessages(input.id).catch((error) => {
      console.error('error on getMessages', error)
      throw error
    })

    try {
      const result = generateStream({
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
        messageMetadata: ({ part }) => {
          if (part.type === 'finish') {
            return {
              updatedAt: new Date(),
            }
          }
        },
        onFinish: async (result) => {
          console.info('stream finished', JSON.stringify({
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
            // await db.update(chats).set({ activeStreamId: null }).where(eq(chats.id, input.id))
          }
          catch (error) {
            console.error('error onFinish transaction', error)
            throw error
          }
        },
        onError: (error) => {
          console.error('error toUIMessageStream onError', error)

          return handleError(error)
        },
        // consumeSseStream: async ({ stream }) => {
        //   const streamId = v7()

        //   try {
        //     console.log('create new resumable stream', streamId, id)
        //     await streamContext.createNewResumableStream(streamId, () => stream)
        //     await db.update(chats).set({ activeStreamId: streamId }).where(eq(chats.id, id))
        //   }
        //   catch (error) {
        //     console.error('consume stream error', error)
        //   }
        // },
      })

      return streamToEventIterator(stream)
    }
    catch (error) {
      console.error('error on ask', error)
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: error instanceof Error ? error.message : 'Sorry, I was unable to generate a response due to an error. Please try again.',
      })
    }
  })
