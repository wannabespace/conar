import type { AppUIMessage } from '@conar/shared/ai'
import type { LanguageModel } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { chatInputType, tools } from '@conar/shared/ai'
import { streamToEventIterator } from '@orpc/server'
import { convertToModelMessages, smoothStream, stepCountIs, streamText } from 'ai'
import { eq } from 'drizzle-orm'
// import { createResumableStreamContext } from 'resumable-stream'
import { v7 } from 'uuid'
import { chats, chatsMessages, db } from '~/drizzle'
import { authMiddleware, orpc } from '..'

const mainModel = anthropic('claude-3-7-sonnet-20250219')
// const fallbackModel = anthropic('claude-3-5-haiku-latest')

// const streamContext = createResumableStreamContext({
//   waitUntil: null,
// })

function handleError(error: unknown) {
  if (typeof error === 'object' && (error as { type?: string }).type === 'overloaded_error') {
    return 'Sorry, I was unable to generate a response due to high load. Please try again later.'
  }
  return 'Sorry, I was unable to generate a response due to an error. Please try again.'
}

async function getMessages(chatId: string) {
  const rows = await db.select().from(chatsMessages).where(eq(chatsMessages.chatId, chatId))

  return rows.map(row => ({
    ...row,
    metadata: row.metadata || undefined,
  })) satisfies AppUIMessage[]
}

function generateStream({
  messages,
  type,
  context,
  currentQuery,
  model,
  signal,
}: {
  messages: AppUIMessage[]
  type: typeof chatInputType.infer['type']
  context: typeof chatInputType.infer['context']
  currentQuery?: string
  model: LanguageModel
  signal?: AbortSignal
}) {
  console.info('messages', JSON.stringify(messages, null, 2))

  return streamText({
    messages: [
      {
        role: 'system',
        content: `You are an SQL tool that generates valid SQL code for ${type} database.

        Requirements:
        - Ensure the SQL is 100% valid and optimized for ${type} database
        - Use proper table and column names exactly as provided in the context
        - Use 2 spaces for indentation and consistent formatting
        - Consider performance implications for complex queries
        - The SQL code will be executed directly in a production database editor
        - Generate SQL query only for the provided schemas, tables, columns and enums
        - Answer in markdown and paste the SQL code in a code block, do not use headings
        - Answer in the same language as the user's message
        - Use quotes for table and column names to prevent SQL errors with case sensitivity

        Additional information:
        - Current date and time: ${new Date().toISOString()}

        Current code in the SQL runner that user is editing:
        ${currentQuery || 'Empty'}

        Database Context:
        ${JSON.stringify(context, null, 2)}
      `.trim(),
      },
      ...convertToModelMessages(messages),
    ],
    stopWhen: stepCountIs(20),
    abortSignal: signal,
    model,
    experimental_transform: smoothStream(),
    tools,
  })
}

async function ensureChat(id: string, userId: string, databaseId: string) {
  const [chat] = await db.select()
    .from(chats)
    .where(eq(chats.id, id))

  if (chat) {
    return chat
  }

  const [createdChat] = await db.insert(chats)
    .values({ id, userId, databaseId })
    .returning()

  return createdChat
}

export const sqlChat = orpc
  .use(authMiddleware)
  .input(chatInputType)
  .handler(async ({ input, context, signal }) => {
    await ensureChat(input.id, context.user.id, input.databaseId)

    const messages = [...await getMessages(input.id), input.prompt]

    const result = generateStream({
      type: input.type,
      model: mainModel,
      context: input.context,
      messages,
      currentQuery: input.currentQuery,
      signal,
    })

    return streamToEventIterator(result.toUIMessageStream({
      originalMessages: messages,
      generateMessageId: () => v7(),
      onFinish: async (result) => {
        console.info('stream finished', JSON.stringify(result.responseMessage, null, 2))

        await db.transaction(async (tx) => {
          await tx.insert(chatsMessages).values({
            ...result.responseMessage,
            chatId: input.id,
          })
          // await tx.update(chats).set({ activeStreamId: null }).where(eq(chats.id, input.id))
        }).catch((error) => {
          console.error('error onFinish transaction', error)
          throw error
        })
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
    }))
  })
