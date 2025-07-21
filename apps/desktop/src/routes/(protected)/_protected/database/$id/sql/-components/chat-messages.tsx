import type { UIMessage } from '@ai-sdk/react'
import type { ComponentProps } from 'react'
import { useChat } from '@ai-sdk/react'
import { Avatar, AvatarFallback } from '@conar/ui/components/avatar'
import { Button } from '@conar/ui/components/button'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { copy } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import { RiArrowDownLine, RiArrowDownSLine, RiFileCopyLine, RiRefreshLine, RiRestartLine } from '@remixicon/react'
import { isToolUIPart } from 'ai'
import { useEffect, useRef, useState } from 'react'
import { useStickToBottom } from 'use-stick-to-bottom'
import { Markdown } from '~/components/markdown'
import { UserAvatar } from '~/entities/user'
import { sleep } from '~/lib/helpers'
import { pageHooks, pageStore } from '../-lib'
import { ChatImages } from './chat-images'
import { ChatMessageTool } from './chat-message-tools'
import { useChatContext } from './chat-provider'

function ChatMessage({ children, className, ...props }: ComponentProps<'div'>) {
  return (
    <div data-mask className={cn('flex flex-col gap-2 text-sm', className)} {...props}>
      {children}
    </div>
  )
}

function ChatMessagePart({ parts, onEdit, loading }: { parts: UIMessage['parts'], onEdit?: (query: string) => void, loading?: boolean }) {
  return parts.map((part, index) => {
    if (part.type === 'text') {
      return (
        <Markdown
          key={index}
          content={part.text}
          onEdit={onEdit}
          loading={loading}
        />
      )
    }
    if (part.type === 'reasoning') {
      return (
        <div key={index} className="text-muted-foreground">
          <p className="text-xs font-medium">Reasoning</p>
          <p className="text-xs">{part.text}</p>
        </div>
      )
    }
    if (isToolUIPart(part)) {
      return <ChatMessageTool key={index} part={part} />
    }

    return null
  })
}

function UserMessage({ message, className, ...props }: { message: UIMessage } & ComponentProps<'div'>) {
  const [isVisible, setIsVisible] = useState(false)
  const [contentHeight, setContentHeight] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const images = message.parts.filter(part => part.type === 'file').map(part => part.url)

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [message.parts])

  const shouldHide = contentHeight > 200

  return (
    <ChatMessage className={cn('group/message', className)} {...props}>
      <UserAvatar className="size-7" />
      <div>
        <div
          ref={contentRef}
          className={cn(
            'relative inline-flex bg-primary text-primary-foreground rounded-lg px-2 py-1 overflow-hidden',
            shouldHide && !isVisible && 'max-h-[100px]',
          )}
        >
          <ChatMessagePart parts={message.parts} />
          {shouldHide && (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-primary-foreground! hover:bg-primary-foreground/10! -mr-1"
                onClick={() => setIsVisible(!isVisible)}
              >
                <RiArrowDownSLine className={cn('duration-100', isVisible ? 'rotate-180' : 'rotate-0')} />
              </Button>
              {!isVisible && <div className="absolute z-10 bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-primary to-transparent pointer-events-none" />}
            </>
          )}
        </div>
      </div>
      {images.length > 0 && (
        <ChatImages
          images={images.map((image, index) => ({
            name: `Image #${index + 1}`,
            url: image,
          }))}
          imageClassName="size-8"
        />
      )}
    </ChatMessage>
  )
}

function AssistantAvatar() {
  return (
    <Avatar className="size-7">
      <AvatarFallback className="text-xs">AI</AvatarFallback>
    </Avatar>
  )
}

function AssistantMessage({
  message,
  last,
  loading,
  onReload,
  className,
  ...props
}: {
  message: UIMessage
  last: boolean
  onReload: () => void
  loading?: boolean
} & ComponentProps<'div'>) {
  async function handleEdit(query: string) {
    pageStore.setState(state => ({
      ...state,
      query,
    }))
    await sleep(0)
    pageHooks.callHook('focusRunner')
  }

  return (
    <ChatMessage className={cn('group/message', className)} {...props}>
      <AssistantAvatar />
      <ChatMessagePart
        parts={message.parts}
        onEdit={handleEdit}
        loading={loading && last}
      />
      <div className="flex items-center -ml-1 -mt-1 gap-1 opacity-0 group-hover/message:opacity-100 transition-opacity duration-150">
        {last && !loading && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={onReload}
                >
                  <RiRestartLine className="size-3.5 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Regenerate</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => copy(message.parts.filter(part => part.type === 'text').map(part => part.text).join('\n'), 'Message copied to clipboard')}
              >
                <RiFileCopyLine className="size-3.5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy message</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </ChatMessage>
  )
}

function ErrorMessage({ error, onReload, ...props }: { error: Error, onReload: () => void } & ComponentProps<'div'>) {
  return (
    <ChatMessage {...props}>
      <AssistantAvatar />
      <p className="text-red-500">{error.message}</p>
      <div>
        <Button variant="outline" size="xs" onClick={onReload}>
          <RiRefreshLine className="size-3" />
          Try again
        </Button>
      </div>
    </ChatMessage>
  )
}

export function ChatMessages({
  className,
  ...props
}: ComponentProps<'div'>) {
  const chat = useChatContext()
  const { scrollRef, contentRef, scrollToBottom, isAtBottom } = useStickToBottom({ initial: 'instant' })
  const { messages, status, error, regenerate } = useChat({ chat })

  useEffect(() => {
    return pageHooks.hook('sendMessage', () => {
      scrollToBottom()
    })
  }, [])

  return (
    <ScrollArea
      ref={scrollRef}
      className={cn('relative -mx-4', className)}
      {...props}
    >
      <div ref={contentRef} className="relative flex flex-col gap-8 px-4">
        {messages.map((message, index) => (
          message.role === 'user'
            ? <UserMessage key={message.id} message={message} />
            : (
                <AssistantMessage
                  key={message.id}
                  message={message}
                  last={index === messages.length - 1}
                  loading={status === 'submitted' || status === 'streaming'}
                  onReload={regenerate}
                />
              )
        ))}
        {status === 'submitted' && (
          <ChatMessage className="flex flex-col items-start gap-2">
            <AssistantAvatar />
            <p className="text-muted-foreground animate-pulse">
              Thinking...
            </p>
          </ChatMessage>
        )}
        {error && <ErrorMessage error={error} onReload={regenerate} />}
      </div>
      <div className={cn('sticky bottom-4 z-10 transition-opacity duration-150', isAtBottom ? 'opacity-0 pointer-events-none' : 'opacity-100')}>
        <Button
          size="icon-sm"
          variant="secondary"
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
          onClick={() => scrollToBottom()}
        >
          <RiArrowDownLine />
        </Button>
      </div>
    </ScrollArea>
  )
}
