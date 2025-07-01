import type { UseChatHelpers } from '@ai-sdk/react'
import type { ComponentProps } from 'react'
import { Avatar, AvatarFallback } from '@conar/ui/components/avatar'
import { Button } from '@conar/ui/components/button'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { useAsyncEffect } from '@conar/ui/hookas/use-async-effect'
import { useMountedEffect } from '@conar/ui/hookas/use-mounted-effect'
import { copy } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import { RiFileCopyLine, RiRefreshLine, RiRestartLine } from '@remixicon/react'
import { Fragment, useRef } from 'react'
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
  return (
    <ChatMessage className={cn('group/message', className)} {...props}>
      <UserAvatar className="size-6" />
      <Markdown content={text} />
      {!!attachments && attachments.length > 0 && (
        <ChatImages
          images={attachments.map(attachment => ({
            name: attachment.name ?? '',
            url: attachment.url,
          }))}
          imageClassName="size-8"
        />
      )}
      <div className="flex items-center -ml-1 -mt-1 gap-1 opacity-0 group-hover/message:opacity-100 transition-opacity duration-150">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => {
                  copy(text, 'Message copied to clipboard')
                }}
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

function AssistantAvatar() {
  return (
    <Avatar className="size-6">
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
                onClick={() => {
                  copy(text, 'Message copied to clipboard')
                }}
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
  const scrollRef = useRef<HTMLDivElement>(null)

  useMountedEffect(() => {
    chatMessages.set(id, messages)
  }, [messages])

  const firstTimeRendered = useRef(false)
  function scrollToBottom() {
    if (messages.length === 0 || !scrollRef.current)
      return

    if (firstTimeRendered.current) {
      scrollRef.current?.scrollTo({
        top: scrollRef.current?.scrollHeight,
        behavior: 'smooth',
      })
    }
    else {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      firstTimeRendered.current = true
    }
  }

  useAsyncEffect(async () => {
    await sleep(0) // To wait for the messages to be rendered
    scrollToBottom()
  }, [messages.length])

  return (
    <ScrollArea
      ref={scrollRef}
      className={cn('relative -mx-4', className)}
      {...props}
    >
      <div className="flex flex-col gap-6 px-4">
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
    </ScrollArea>
  )
}
