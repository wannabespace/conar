import type { UseChatHelpers } from '@ai-sdk/react'
import { Button } from '@connnect/ui/components/button'
import { CardTitle } from '@connnect/ui/components/card'
import { DotsBg } from '@connnect/ui/components/custom/dots-bg'
import { ScrollArea } from '@connnect/ui/components/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { useAsyncEffect } from '@connnect/ui/hookas/use-async-effect'
import { RiChatAiLine, RiCornerDownLeftLine, RiDeleteBinLine, RiStopCircleLine } from '@remixicon/react'
import { useParams } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { sleep } from '~/lib/helpers'
import { pageHooks, pageStore } from '..'
import { useDatabaseChat } from '../-hooks/use-database-chat'
import { ChatError } from './chat-error'
import { ChatForm } from './chat-form'
import { ChatMessages } from './chat-messages'

function getBase64(file: File): Promise<string | ArrayBuffer | null> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.addEventListener('load', () => resolve(reader.result))

    reader.readAsDataURL(file)
  })
}

export function Chat() {
  const { id } = useParams({ from: '/(protected)/_protected/database/$id/sql/' })
  const scrollRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    setMessages,
    append,
    input,
    setInput,
    status,
    error,
    reload,
    stop,
  } = useDatabaseChat(id)

  useAsyncEffect(async () => {
    await sleep(0) // To wait for the messages to be rendered
    scrollRef.current?.scrollTo({
      top: scrollRef.current?.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages.length])

  useEffect(() => {
    return pageHooks.hook('fix', async (error) => {
      await handleSend({ value: `Fix the following SQL error: ${error}`, status })
    })
  }, [status])

  async function handleSend({
    value,
    status,
  }: {
    value: string
    status: UseChatHelpers['status']
  }) {
    if (value.trim() === '' || status === 'submitted' || status === 'streaming')
      return

    const filesBase64 = await Promise.all(pageStore.state.files.map(getBase64))

    append({
      role: 'user',
      content: value,
    }, {
      experimental_attachments: filesBase64.map((base64, index) => ({
        name: `attachment-${index + 1}.png`,
        contentType: 'image/png',
        url: base64 as string,
      })),
      body: {
        model: pageStore.state.model,
      },
    })
    setInput('')
    pageStore.setState(state => ({
      ...state,
      files: [],
    }))
    await sleep(0)
    scrollRef.current?.scrollTo({
      top: scrollRef.current?.scrollHeight,
      behavior: 'smooth',
    })
  }

  return (
    <div className="relative flex h-screen flex-col justify-between gap-2 p-4">
      <DotsBg
        className="absolute -z-10 inset-0 opacity-30 [mask-image:linear-gradient(to_bottom_left,white,transparent,transparent)]"
      />
      <div className="flex justify-between items-center mb-4">
        <CardTitle className="flex items-center gap-2">
          <RiChatAiLine className="size-5" />
          AI Assistant
        </CardTitle>
        {/* <Button variant="outline" size="icon">
          <RiHistoryLine className="size-4" />
        </Button> */}
        {messages.length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="iconSm"
                  onClick={() => setMessages([])}
                >
                  <RiDeleteBinLine className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Clear chat history
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {messages.length === 0 && !error && (
        <ChatError />
      )}
      <ScrollArea scrollRef={scrollRef} className="flex-1 overflow-y-auto -mx-4 px-4">
        <ChatMessages
          messages={messages}
          status={status}
          error={error}
          onReload={reload}
        />
      </ScrollArea>
      <ChatForm
        input={input}
        setInput={setInput}
        onEnter={value => handleSend({ value, status })}
        actions={(
          <>
            {(status === 'streaming' || status === 'submitted') && (
              <Button
                type="button"
                size="xs"
                variant="outline"
                disabled={status === 'submitted'}
                onClick={stop}
              >
                <RiStopCircleLine className="size-3" />
                Stop
              </Button>
            )}
            {(status !== 'submitted' && status !== 'streaming') && (
              <Button
                size="xs"
                disabled={!input.trim()}
                onClick={() => handleSend({ value: input, status })}
              >
                Send
                <RiCornerDownLeftLine className="size-3" />
              </Button>
            )}
          </>
        )}
      />
    </div>
  )
}
