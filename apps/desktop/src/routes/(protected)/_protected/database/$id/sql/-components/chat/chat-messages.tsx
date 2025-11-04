import type { UIMessage } from '@ai-sdk/react'
import type { ChatStatus } from 'ai'
import type { ComponentProps, ReactNode } from 'react'
import { useChat } from '@ai-sdk/react'
import { Alert, AlertDescription, AlertTitle } from '@conar/ui/components/alert'
import { AppLogo } from '@conar/ui/components/brand/app-logo'
import { Button } from '@conar/ui/components/button'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { useElementSize } from '@conar/ui/hookas/use-element-size'
import { copy } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import { RiAlertLine, RiArrowDownLine, RiArrowDownSLine, RiCheckLine, RiFileCopyLine, RiLoopLeftLine, RiPlayListAddLine, RiRestartLine } from '@remixicon/react'
import { useStore } from '@tanstack/react-store'
import { isToolUIPart } from 'ai'
import { regex } from 'arkregex'
import { useEffect, useRef, useState } from 'react'
import { useStickToBottom } from 'use-stick-to-bottom'
import { Markdown } from '~/components/markdown'
import { UserAvatar } from '~/entities/user'
import { Route } from '../..'
import { chatHooks, runnerHooks } from '../../-page'
import { databaseStore } from '../../../../-store'
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

function ChatMessageCodeActions({ content }: { content: string }) {
  const { database } = Route.useRouteContext()
  const store = databaseStore(database.id)
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
          className="min-w-[220px] max-h-64 overflow-auto"
          onCloseAutoFocus={e => e.preventDefault()}
          onClick={e => e.stopPropagation()}
        >
          <div className="px-2 py-2 text-xs font-medium text-muted-foreground">
            Replace existing query
          </div>
          {editorQueries.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground select-none">
              No queries found
            </div>
          )}
          {editorQueries.map((q, index) => (
            <DropdownMenuItem
              key={`${q.startLineNumber}-${q.endLineNumber}`}
              className="flex items-center justify-between w-full gap-2"
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
              <span className="text-[10px] text-muted-foreground/70 font-mono">
                {q.startLineNumber === q.endLineNumber
                  ? `Line ${q.startLineNumber}`
                  : `Lines ${q.startLineNumber} - ${q.endLineNumber}`}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function ChatMessageParts({ parts, loading }: { parts: UIMessage['parts'], loading?: boolean }) {
  return parts.map((part, index) => {
    if (part.type === 'text') {
      return (
        <Markdown
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          content={part.text}
          generating={loading}
          codeActions={props => <ChatMessageCodeActions {...props} />}
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
  const partsRef = useRef<HTMLDivElement>(null)
  const { height } = useElementSize(partsRef, {
    width: 0,
    height: 0,
  })
  const images = message.parts.filter(part => part.type === 'file').map(part => part.url)

  const canHide = height > 200

  return (
    <ChatMessage className={cn('group/message', className)} {...props}>
      <UserAvatar className="size-7" />
      <div>
        <div
          className={cn(
            'relative inline-flex bg-primary text-primary-foreground rounded-lg px-2 py-1 overflow-hidden',
            !isVisible && 'max-h-[100px]',
          )}
        >
          <div className="h-fit" ref={partsRef}>
            <ChatMessageParts parts={message.parts} />
          </div>
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
              {!isVisible && <div className="absolute z-10 bottom-0 left-0 right-0 h-16 bg-linear-to-t from-primary to-transparent pointer-events-none" />}
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
  const { chat } = Route.useLoaderData()
  const ref = useRef<HTMLDivElement>(null)
  const { height } = useElementSize(ref)

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
    return chatHooks.hook('scrollToBottom', () => {
      scrollToBottom()
    })
  }, [scrollToBottom])

  useEffect(() => {
    if (userMessageRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks-extra/no-direct-set-state-in-use-effect
      setPlaceholderHeight(
        (scrollRef.current?.offsetHeight || 0) - (userMessageRef.current?.offsetHeight || 0) - MESSAGES_GAP,
      )
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
