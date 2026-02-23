import type { UIMessage } from '@ai-sdk/react'
import type { ChatStatus } from 'ai'
import type { ComponentProps, ReactNode } from 'react'
import { useChat } from '@ai-sdk/react'
import { isToolUIPart } from '@conar/api/ai/tools/helpers'
import { Alert, AlertDescription, AlertTitle } from '@conar/ui/components/alert'
import { AppLogo } from '@conar/ui/components/brand/app-logo'
import { Button } from '@conar/ui/components/button'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { UserAvatar } from '@conar/ui/components/custom/user-avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { useElementSize } from '@conar/ui/hookas/use-element-size'
import { copy } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import { RiAlertLine, RiArrowDownLine, RiArrowDownSLine, RiCheckLine, RiFileCopyLine, RiLoopLeftLine, RiPlayListAddLine, RiRestartLine } from '@remixicon/react'
import { useStore } from '@tanstack/react-store'
import { regex } from 'arkregex'
import { useEffect, useRef, useState } from 'react'
import { useStickToBottom } from 'use-stick-to-bottom'
import { Markdown } from '~/components/markdown'
import { connectionResourceStore } from '~/entities/connection/store'
import { useSubscription } from '~/entities/user/hooks'
import { authClient } from '~/lib/auth'
import { Route } from '../..'
import { chatHooks, runnerHooks } from '../../-page'
import { ChatImages } from './chat-images'
import { ChatMessageTool } from './chat-message-tools'

const COMMENT_REGEX = regex('^(?:--.*\n)+')

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

function ChatMessageCodeActions({ content, lang }: { content: string, lang: string }) {
  const { connectionResource } = Route.useRouteContext()
  const store = connectionResourceStore(connectionResource.id)
  const editorQueries = useStore(store, state => state.editorQueries)

  const [isCopying, setIsCopying] = useState(false)
  const [isAppending, setIsAppending] = useState(false)
  const [isReplacing, setIsReplacing] = useState(false)

  function getQueryNumber(index: number) {
    const queriesBefore = editorQueries.slice(0, index).reduce((sum, curr) => sum + curr.queries.length, 0) + 1
    const queriesLength = editorQueries[index]?.queries.length ?? 0
    return queriesLength === 1 ? queriesBefore : `${queriesBefore} - ${queriesBefore + queriesLength - 1}`
  }

  function replaceQuery(query: typeof editorQueries[number]) {
    runnerHooks.callHook('replaceQuery', {
      query: content.replace(COMMENT_REGEX, ''),
      startLineNumber: query.startLineNumber,
      endLineNumber: query.endLineNumber,
    })
    runnerHooks.callHook('scrollToLine', query.startLineNumber)

    // Prevent the dropdown menu from focus
    window.requestAnimationFrame(() => {
      runnerHooks.callHook('focus', query.startLineNumber)
    })
    setIsReplacing(true)
  }

  return (
    <div className="flex gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                setIsCopying(true)
                copy(content)
              }}
            >
              <ContentSwitch
                active={isCopying}
                activeContent={<RiCheckLine className="text-success" />}
                onSwitchEnd={() => setIsCopying(false)}
              >
                <RiFileCopyLine className="size-3.5" />
              </ContentSwitch>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Copy to clipboard
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {lang === 'sql' && (
        <>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    runnerHooks.callHook('appendToBottomAndFocus', content)
                    setIsAppending(true)
                  }}
                >
                  <ContentSwitch
                    active={isAppending}
                    activeContent={<RiCheckLine className="text-success" />}
                    onSwitchEnd={() => setIsAppending(false)}
                  >
                    <RiPlayListAddLine className="size-3.5" />
                  </ContentSwitch>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Append to bottom of runner
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <DropdownMenuTrigger asChild>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={e => e.stopPropagation()}
                    >
                      <ContentSwitch
                        active={isReplacing}
                        activeContent={<RiCheckLine className="text-success" />}
                        onSwitchEnd={() => setIsReplacing(false)}
                      >
                        <RiLoopLeftLine className="size-3.5" />
                      </ContentSwitch>
                    </Button>
                  </TooltipTrigger>
                </DropdownMenuTrigger>
                <TooltipContent>
                  Replace a query in the runner
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent
              align="end"
              className="max-h-64 min-w-[220px] overflow-auto"
              onCloseAutoFocus={e => e.preventDefault()}
              onClick={e => e.stopPropagation()}
            >
              <div className="p-2 text-xs font-medium text-muted-foreground">
                Replace existing query
              </div>
              {editorQueries.length === 0 && (
                <div className={`
                  px-3 py-2 text-xs text-muted-foreground select-none
                `}
                >
                  No queries found
                </div>
              )}
              {editorQueries.map((q, index) => (
                <DropdownMenuItem
                  key={`${q.startLineNumber}-${q.endLineNumber}`}
                  className="flex w-full items-center justify-between gap-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    replaceQuery(q)
                  }}
                >
                  <span className="text-xs font-medium">
                    Query
                    {' '}
                    {getQueryNumber(index)}
                  </span>
                  <span className={`
                    font-mono text-[10px] text-muted-foreground/70
                  `}
                  >
                    {q.startLineNumber === q.endLineNumber
                      ? `Line ${q.startLineNumber}`
                      : `Lines ${q.startLineNumber} - ${q.endLineNumber}`}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  )
}

function ChatMessageParts({ parts, loading }: { parts: UIMessage['parts'], loading?: boolean }) {
  return parts.map((part, index) => {
    const key = `${part.type}-${index}`

    if (part.type === 'text') {
      return (
        <Markdown
          key={key}
          content={part.text}
          generating={loading}
          codeActions={props => <ChatMessageCodeActions {...props} />}
        />
      )
    }

    if (part.type === 'reasoning') {
      return (
        <div
          key={key}
          className={cn(loading && 'animate-in duration-200 fade-in')}
        >
          <p className="text-xs font-medium">Reasoning</p>
          <p className="text-xs">{part.text}</p>
        </div>
      )
    }

    if (isToolUIPart(part)) {
      return (
        <ChatMessageTool
          key={key}
          className={cn(loading && 'animate-in duration-200 fade-in')}
          part={part}
        />
      )
    }

    return null
  })
}

function UserMessage({ message, className, ...props }: { message: UIMessage } & ComponentProps<'div'>) {
  const [isVisible, setIsVisible] = useState(false)
  const partsRef = useRef<HTMLDivElement>(null)
  const { height } = useElementSize(partsRef, {
    width: 0,
    height: 0,
  })
  const images = message.parts.filter(part => part.type === 'file').map(part => part.url)
  const { data } = authClient.useSession()
  const canHide = height > 200

  return (
    <ChatMessage className={cn('group/message', className)} {...props}>
      <UserAvatar className="size-7" user={data?.user} />
      <div>
        <div
          className={cn(
            `
              relative inline-flex rounded-lg bg-primary px-2 py-1
              text-primary-foreground
            `,
            canHide && !isVisible && 'max-h-[100px] overflow-hidden',
          )}
        >
          <div
            className={`
              h-fit
              [&_a]:text-white
            `}
            ref={partsRef}
          >
            <ChatMessageParts parts={message.parts} />
          </div>
          {canHide && (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                className={`
                  -mr-1 shrink-0 text-primary-foreground!
                  hover:bg-primary-foreground/10!
                `}
                onClick={() => setIsVisible(!isVisible)}
              >
                <RiArrowDownSLine className={cn('duration-100', isVisible
                  ? `rotate-180`
                  : `rotate-0`)}
                />
              </Button>
              {!isVisible && (
                <div className={`
                  pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16
                  bg-linear-to-t from-primary to-transparent
                `}
                />
              )}
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
      className={cn(`
        flex animate-pulse items-center gap-2 text-muted-foreground
      `, className)}
      {...props}
    >
      <AppLogo className="size-4" />
      {children}
    </div>
  )
}

function AssistantMessage({ message, isLast, status, className, ...props }: { message: UIMessage, isLast: boolean, status: ChatStatus } & ComponentProps<'div'>) {
  const { chat } = Route.useLoaderData()
  const ref = useRef<HTMLDivElement>(null)
  const { height } = useElementSize(ref)
  const { subscription } = useSubscription()

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
          />
        </div>
      </div>
      <div className={`
        sticky bottom-0 z-30 mt-2 -mr-1 flex items-center justify-between gap-1
        first:mt-0
      `}
      >
        <div className={cn('duration-150', isLoading
          ? 'opacity-100'
          : `pointer-events-none opacity-0`)}
        >
          <AssistantMessageLoader>
            {status === 'submitted' ? 'Thinking...' : 'Writing...'}
          </AssistantMessageLoader>
        </div>
        <div className={`
          flex items-center gap-1 opacity-0 transition-opacity duration-150
          group-hover/message:opacity-100
        `}
        >
          {isLast && (
            <ChatMessageFooterButton
              icon={<RiRestartLine className="size-4 text-muted-foreground" />}
              tooltip="Regenerate message"
              disabled={status === 'streaming' || status === 'submitted' || !subscription}
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
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              onClick={() => chat.regenerate()}
            >
              Retry
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </ChatMessage>
  )
}

const MESSAGES_GAP = 16

export function ChatMessages({ className }: ComponentProps<'div'>) {
  const { chat } = Route.useLoaderData()
  const { scrollRef, contentRef, scrollToBottom, isNearBottom } = useStickToBottom({ initial: 'instant' })
  const { messages, error, status } = useChat({ chat })
  const userMessageRef = useRef<HTMLDivElement>(null)
  const [placeholderHeight, setPlaceholderHeight] = useState(0)

  useEffect(() => {
    return chatHooks.hook('scrollToBottom', () => {
      scrollToBottom()
    })
  }, [scrollToBottom])

  useEffect(() => {
    if (!userMessageRef.current)
      return

    const frame = requestAnimationFrame(() => {
      setPlaceholderHeight(
        (scrollRef.current?.offsetHeight || 0) - (userMessageRef.current?.offsetHeight || 0) - MESSAGES_GAP,
      )
    })

    return () => cancelAnimationFrame(frame)
  }, [scrollRef, userMessageRef, messages.length])

  const isLastMessageFromUser = messages.at(-1)?.role === 'user'

  return (
    <ScrollArea
      ref={scrollRef}
      className={cn('relative -mx-4', className)}
    >
      <div
        ref={contentRef}
        className="relative flex flex-col px-4"
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
      <div className={cn('sticky bottom-4 z-40 transition-opacity duration-150', isNearBottom
        ? `pointer-events-none opacity-0`
        : '')}
      >
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
