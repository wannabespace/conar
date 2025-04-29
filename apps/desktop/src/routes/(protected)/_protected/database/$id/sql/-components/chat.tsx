import type { UseChatHelpers } from '@ai-sdk/react'
import type { ComponentProps } from 'react'
import { getBase64FromFiles } from '@connnect/shared/utils/base64'
import { Button } from '@connnect/ui/components/button'
import { CardTitle } from '@connnect/ui/components/card'
import { ScrollArea } from '@connnect/ui/components/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { useAsyncEffect } from '@connnect/ui/hookas/use-async-effect'
import { cn } from '@connnect/ui/lib/utils'
import { RiChatAiLine, RiDeleteBinLine } from '@remixicon/react'
import { useParams } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { sleep } from '~/lib/helpers'
import { pageHooks, pageStore } from '..'
import { useDatabaseChat } from '../-hooks/use-database-chat'
import { ChatForm } from './chat-form'
import { ChatMessages } from './chat-messages'
import { ChatPlaceholder } from './chat-placeholder'

export function Chat({ className, ...props }: ComponentProps<'div'>) {
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

  const statusRef = useRef<UseChatHelpers['status']>(status)

  useEffect(() => {
    // I don't know why, but status is not changing in functions like handleSend
    statusRef.current = status
  }, [status])

  const handleSend = async (value: string) => {
    if (
      value.trim() === ''
      || statusRef.current === 'streaming'
      || statusRef.current === 'submitted'
    ) {
      return
    }

    const cachedValue = value
    const cachedFiles = [...pageStore.state.files]

    try {
      const filesBase64 = await getBase64FromFiles(cachedFiles)

      setInput('')
      pageStore.setState(state => ({
        ...state,
        files: [],
      }))

      await append({
        role: 'user',
        content: cachedValue,
      }, {
        experimental_attachments: filesBase64.map((base64, index) => ({
          name: `attachment-${index + 1}.png`,
          contentType: 'image/png',
          url: base64,
        })),
        body: {
          model: pageStore.state.model,
        },
      })
    }
    catch (error) {
      setInput(cachedValue)
      pageStore.setState(state => ({
        ...state,
        files: cachedFiles,
      }))
      toast.error('Failed to send message', {
        description: error instanceof Error
          ? error.message
          : 'An unexpected error occurred. Please try again.',
      })
    }
  }

  useAsyncEffect(async () => {
    if (messages.length === 0)
      return

    await sleep(0) // To wait for the messages to be rendered
    scrollRef.current?.scrollTo({
      top: scrollRef.current?.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages.length])

  useEffect(() => {
    return pageHooks.hook('fix', async (error) => {
      await handleSend(`Fix the following SQL error: ${error}`)
    })
  }, [handleSend])

  return (
    <div className={cn('relative flex flex-col justify-between gap-2 p-4 bg-muted/20', className)} {...props}>
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
        <ChatPlaceholder />
      )}
      <ScrollArea
        scrollRef={scrollRef}
        className="relative flex-1 overflow-y-auto px-4 -mx-4"
      >
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
        handleSend={handleSend}
        status={status}
        stop={stop}
      />
    </div>
  )
}
