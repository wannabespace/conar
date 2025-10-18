import type { UIMessage } from '@ai-sdk/react'
import type { ChatStatus } from 'ai'
import type { ComponentProps, ReactNode } from 'react'
import { useChat } from '@ai-sdk/react'
import { sleep } from '@conar/shared/utils/helpers'
import { Alert, AlertDescription, AlertTitle } from '@conar/ui/components/alert'
import { AppLogo } from '@conar/ui/components/brand/app-logo'
import { Button } from '@conar/ui/components/button'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { useElementSize } from '@conar/ui/hookas/use-element-size'
import { useIsMounted } from '@conar/ui/hookas/use-is-mounted'
import { copy } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import { RiAlertLine, RiArrowDownLine, RiArrowDownSLine, RiFileCopyLine, RiRestartLine } from '@remixicon/react'
import { isToolUIPart } from 'ai'
import { useEffect, useRef, useState } from 'react'
import { useStickToBottom } from 'use-stick-to-bottom'
import { Markdown } from '~/components/markdown'
import { UserAvatar } from '~/entities/user'
import { Route } from '../..'
import { pageHooks } from '../../-page'
import { databaseStore } from '../../../../-store'
import { ChatImages } from './chat-images'
import { ChatMessageTool } from './chat-message-tools'

function ChatMessage({ children, className, ...props }: ComponentProps<'div'>) {
  return (
    <div data-mask className={cn('flex flex-col gap-2 text-sm', className)} {...props}>
      {children}
    </div>
  )
}

function ChatMessageFooterButton({ onClick, icon, tooltip, disabled }: { onClick: () => void, icon: ReactNode, tooltip: string, disabled?: boolean }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClick}
            disabled={disabled}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function ChatMessageParts({ parts, loading, onAdd }: { parts: UIMessage['parts'], loading?: boolean, onAdd?: (query: string) => void }) {
  return parts.map((part, index) => {
    if (part.type === 'text') {
      return (
        <Markdown
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          content={part.text}
          generating={loading}
          onAdd={onAdd}
        />
      )
    }

    if (part.type === 'reasoning') {
      return (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          className={cn(loading && 'animate-in fade-in duration-200')}
        >
          <p className="text-xs font-medium">Reasoning</p>
          <p className="text-xs">{part.text}</p>
        </div>
      )
    }

    if (isToolUIPart(part)) {
      return (
        <ChatMessageTool
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          className={cn(loading && 'animate-in fade-in duration-200')}
          part={part}
        />
      )
    }

    return null
  })
}

function UserMessage({ message, className, ...props }: { message: UIMessage } & ComponentProps<'div'>) {
  const [isVisible, setIsVisible] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  useIsMounted() // Just to trigger rerender to calculate the height on the ref

  const images = message.parts.filter(part => part.type === 'file').map(part => part.url)
  const canHide = contentRef.current ? contentRef.current.scrollHeight > 200 : false

  return (
    <ChatMessage className={cn('group/message', className)} {...props}>
      <UserAvatar className="size-7" />
      <div>
        <div
          ref={contentRef}
          className={cn(
            'relative inline-flex bg-primary text-primary-foreground rounded-lg px-2 py-1 overflow-hidden',
            !isVisible && 'max-h-[100px]',
          )}
        >
          <ChatMessageParts parts={message.parts} />
          {canHide && (
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

function AssistantMessageLoader({ children, className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex items-center gap-2 text-muted-foreground animate-pulse', className)}
      {...props}
    >
      <AppLogo className="size-4" />
      {children}
    </div>
  )
}

function AssistantMessage({ message, isLast, status, className, ...props }: { message: UIMessage, isLast: boolean, status: ChatStatus } & ComponentProps<'div'>) {
  const { database, chat } = Route.useLoaderData()
  const ref = useRef<HTMLDivElement>(null)
  const { height } = useElementSize(ref)
  const store = databaseStore(database.id)

  async function handleAdd(query: string) {
    store.setState(state => ({
      ...state,
      sql: `${state.sql}\n\n${query}`,
    } satisfies typeof state))
    await sleep(0)
    pageHooks.callHook('focusRunner')
  }

  const isLoading = isLast ? status === 'streaming' || status === 'submitted' : false

  return (
    <ChatMessage className={cn('group/message', className)} {...props}>
      <div
        style={{ height: height ? `${height}px` : undefined }}
        className="duration-150"
      >
        <div ref={ref}>
          <ChatMessageParts
            parts={message.parts}
            loading={isLoading}
            onAdd={handleAdd}
          />
        </div>
      </div>
      <div className="sticky bottom-0 z-30 flex items-center justify-between -mr-1 mt-2 gap-1">
        <div className={cn('duration-150', isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
          <AssistantMessageLoader>
            {status === 'submitted' ? 'Thinking...' : 'Writing...'}
          </AssistantMessageLoader>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover/message:opacity-100 transition-opacity duration-150">
          {isLast && (
            <ChatMessageFooterButton
              icon={<RiRestartLine className="size-4 text-muted-foreground" />}
              tooltip="Regenerate message"
              disabled={status === 'streaming' || status === 'submitted'}
              onClick={() => chat.regenerate({ messageId: message.id })}
            />
          )}
          <ChatMessageFooterButton
            icon={<RiFileCopyLine className="size-4 text-muted-foreground" />}
            tooltip="Copy message"
            onClick={() => copy(message.parts.filter(part => part.type === 'text').map(part => part.text).join('\n'), 'Message copied to clipboard')}
          />
        </div>
      </div>
    </ChatMessage>
  )
}

function ErrorMessage({ error, className, ...props }: { error: Error } & ComponentProps<'div'>) {
  const { chat } = Route.useLoaderData()

  return (
    <ChatMessage
      className={cn(
        'relative z-20 flex justify-center',
        className,
      )}
      {...props}
    >
      <Alert>
        <RiAlertLine />
        <AlertTitle>Error generating response</AlertTitle>
        <AlertDescription>
          <p>{error.message}</p>
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              onClick={() => chat.regenerate()}
            >
              Retry
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => chat.regenerate({ body: { fallback: true } })}
            >
              Retry with fallback model
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </ChatMessage>
  )
}

const MESSAGES_GAP = 32

export function ChatMessages({ className }: ComponentProps<'div'>) {
  const { chat } = Route.useLoaderData()
  const { scrollRef, contentRef, scrollToBottom, isNearBottom } = useStickToBottom({ initial: 'instant' })
  const { messages, error, status } = useChat({ chat })
  const userMessageRef = useRef<HTMLDivElement>(null)
  const [placeholderHeight, setPlaceholderHeight] = useState(0)

  useEffect(() => {
    return pageHooks.hook('sendMessage', () => {
      scrollToBottom()
    })
  }, [scrollToBottom])

  useEffect(() => {
    if (userMessageRef.current) {
      setPlaceholderHeight((scrollRef.current?.offsetHeight || 0) - (userMessageRef.current?.offsetHeight || 0) - MESSAGES_GAP)
    }
  }, [scrollRef, userMessageRef, messages.length])

  const isLastMessageFromUser = messages.at(-1)?.role === 'user'

  return (
    <ScrollArea
      ref={scrollRef}
      className={cn('relative -mx-4', className)}
    >
      <div
        ref={contentRef}
        className="relative px-4 flex flex-col"
        style={{ gap: `${MESSAGES_GAP}px` }}
      >
        {messages.map((message, index) => (
          message.role === 'user'
            ? (
                <UserMessage
                  key={message.id}
                  ref={userMessageRef}
                  message={message}
                />
              )
            : (
                <AssistantMessage
                  key={message.id}
                  message={message}
                  isLast={index === messages.length - 1}
                  status={status}
                  style={{
                    minHeight: index === messages.length - 1 ? `${placeholderHeight}px` : undefined,
                  }}
                />
              )
        ))}
        {isLastMessageFromUser && status === 'submitted' && (
          <ChatMessage
            className="flex flex-col items-start gap-2"
            style={{
              minHeight: `${placeholderHeight}px`,
            }}
          >
            <AssistantMessageLoader>
              Thinking...
            </AssistantMessageLoader>
          </ChatMessage>
        )}
        {error && <ErrorMessage error={error} />}
      </div>
      <div className={cn('sticky bottom-4 z-40 transition-opacity duration-150', isNearBottom ? 'opacity-0 pointer-events-none' : '')}>
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
