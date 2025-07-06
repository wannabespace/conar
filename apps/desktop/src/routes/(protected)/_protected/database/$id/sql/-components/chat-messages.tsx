import type { UseChatHelpers } from '@ai-sdk/react'
import type { ComponentProps } from 'react'
import { Avatar, AvatarFallback } from '@conar/ui/components/avatar'
import { Button } from '@conar/ui/components/button'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { useMountedEffect } from '@conar/ui/hookas/use-mounted-effect'
import { copy } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import { RiArrowDownLine, RiArrowDownSLine, RiFileCopyLine, RiRefreshLine, RiRestartLine } from '@remixicon/react'
import { Fragment, useEffect, useRef, useState } from 'react'
import { useStickToBottom } from 'use-stick-to-bottom'
import { Markdown } from '~/components/markdown'
import { UserAvatar } from '~/entities/user'
import { sleep } from '~/lib/helpers'
import { pageHooks, pageStore, Route } from '..'
import { chatMessages } from '../-lib'
import { ChatImages } from './chat-images'

interface attachment {
  name?: string
  url: string
}

function ChatMessage({ children, className, ...props }: ComponentProps<'div'>) {
  return (
    <div data-mask className={cn('flex flex-col gap-2 text-sm', className)} {...props}>
      {children}
    </div>
  )
}

function UserMessage({ text, attachments, className, ...props }: { text: string, attachments?: attachment[] } & ComponentProps<'div'>) {
  const [isVisible, setIsVisible] = useState(false)
  const [contentHeight, setContentHeight] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [text])

  const shouldHide = contentHeight > 200

  return (
    <ChatMessage className={cn('group/message', className)} {...props}>
      <UserAvatar className="size-7" />
      <div>
        <div
          className={cn(
            'relative inline-flex bg-primary text-primary-foreground rounded-lg px-2 py-1 overflow-hidden',
            shouldHide && !isVisible && 'max-h-[100px]',
          )}
        >
          <Markdown ref={contentRef} content={text} />
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
      {!!attachments && attachments.length > 0 && (
        <ChatImages
          images={attachments.map(attachment => ({
            name: attachment.name ?? '',
            url: attachment.url,
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
  text,
  last,
  loading,
  onReload,
  className,
  ...props
}: {
  text: string
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
      <Markdown
        content={text}
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
                onClick={() => copy(text, 'Message copied to clipboard')}
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
  messages,
  status,
  error,
  onReload,
  ...props
}: ComponentProps<'div'> & Pick<UseChatHelpers, 'messages' | 'status' | 'error'> & { onReload: () => void }) {
  const { id } = Route.useParams()
  const { scrollRef, contentRef, scrollToBottom, isAtBottom } = useStickToBottom({ initial: 'instant' })

  useMountedEffect(() => {
    chatMessages.set(id, messages)
  }, [messages])

  useEffect(() => {
    pageHooks.hook('sendMessage', () => {
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
          <Fragment key={message.id}>
            {message.role === 'user'
              ? (
                  <UserMessage
                    text={message.content}
                    attachments={message.experimental_attachments}
                  />
                )
              : (
                  <AssistantMessage
                    text={message.content}
                    last={index === messages.length - 1}
                    loading={status === 'submitted' || status === 'streaming'}
                    onReload={onReload}
                  />
                )}
          </Fragment>
        ))}
        {status === 'submitted' && (
          <ChatMessage className="flex flex-col items-start gap-2">
            <AssistantAvatar />
            <p className="text-muted-foreground animate-pulse">
              Thinking...
            </p>
          </ChatMessage>
        )}
        {error && <ErrorMessage error={error} onReload={onReload} />}
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
