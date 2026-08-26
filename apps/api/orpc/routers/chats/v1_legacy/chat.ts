import { streamToEventIterator } from '@orpc/server'
import type { AppUIMessage } from '@tamery/ai/v1/message'
import { model } from '@tamery/ai/v1/model'
import { chatSystemPrompt } from '@tamery/ai/v1/prompt'
import { createTools } from '@tamery/ai/v1/tools'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import {
  toUIMessageStream,
  convertToModelMessages,
  smoothStream,
  stepCountIs,
  streamText,
} from 'ai'
import { type } from 'arktype'
import { v7 } from 'uuid'

import { env } from '~/env'
import { orpc, subscriptionMiddleware } from '~/orpc'

const tools = createTools({
  context7ApiKey: env.CONTEXT7_API_KEY,
  exaApiKey: env.EXA_API_KEY,
})

const handleError = (error: unknown) => {
  if (
    typeof error === 'object' &&
    (error as { type?: string }).type === 'overloaded_error'
  ) {
    return 'Sorry, I was unable to generate a response due to high load. Please try again later.'
  }
  if (
    typeof error === 'object' &&
    (error as { message?: string }).message?.includes('prompt is too long')
  ) {
    return 'Sorry, I was unable to generate a response. Currently I cannot handle larger chats like yours. Please create a new chat.'
  }
  return 'Sorry, I was unable to generate a response due to an error. Please try again.'
}

export const chat = orpc
  .use(subscriptionMiddleware)
  .use(({ context, next }) => {
    context.setHeader('Transfer-Encoding', 'chunked')
    context.setHeader('Connection', 'keep-alive')

    return next()
  })
  .input(
    type({
      context: 'string',
      createdAt: 'Date',
      id: 'string.uuid.v7',
      messages: 'object[]' as type.cast<AppUIMessage[]>,
      type: type.valueOf(ConnectionType),
      updatedAt: 'Date',
    })
  )
  .handler(async ({ input, context, signal }) => {
    context.addLogData({
      chatId: input.id,
      connectionType: input.type,
      inputMessages: input.messages.map((message) => ({
        id: message.id,
        partsCount: message.parts.length,
        role: message.role,
      })),
    })

    const result = streamText({
      abortSignal: signal,
      allowSystemInMessages: true,
      experimental_transform: smoothStream(),
      messages: [
        {
          content: chatSystemPrompt({
            connectionType: input.type,
            context: input.context,
            tools,
          }),
          role: 'system',
        },
        ...(await convertToModelMessages(input.messages)),
      ],
      model,
      stopWhen: stepCountIs(Number.POSITIVE_INFINITY),
      tools,
    })

    const stream = toUIMessageStream({
      generateMessageId: () => v7(),
      onError: (error) => {
        context.addLogData({
          streamError: error,
        })

        return handleError(error)
      },
      onFinish: (finishResult) => {
        context.addLogData({
          response: {
            ...finishResult.responseMessage,
            parts: finishResult.responseMessage.parts.map((part) => part.type),
          },
        })
      },
      originalMessages: input.messages,
      sendSources: true,
      stream: result.stream,
    })

    return streamToEventIterator(stream)
  })
