import type { Message } from '@ai-sdk/react'
import type { ComponentProps } from 'react'
import { useChat } from '@ai-sdk/react'
import { Avatar, AvatarFallback } from '@connnect/ui/components/avatar'
import { Button } from '@connnect/ui/components/button'
import { CardTitle } from '@connnect/ui/components/card'
import { DotsBg } from '@connnect/ui/components/custom/dots-bg'
import { LoadingContent } from '@connnect/ui/components/custom/loading-content'
import { Input } from '@connnect/ui/components/input'
import { ScrollArea } from '@connnect/ui/components/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { cn } from '@connnect/ui/lib/utils'
import { RiDeleteBinLine, RiQuestionAnswerLine, RiRefreshLine, RiSendPlane2Line, RiStopLine } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { Fragment, useEffect } from 'react'
import { Markdown } from '~/components/markdown'
import { getDatabaseContext, useDatabase } from '~/entities/database'
import { UserAvatar } from '~/entities/user'

const chatInput = {
  get(id: string) {
    return JSON.parse(localStorage.getItem(`sql-chat-input-${id}`) || '[]')
  },
  set(id: string, input: string) {
    localStorage.setItem(`sql-chat-input-${id}`, JSON.stringify(input))
  },
}

const chatMessages = {
  get(id: string) {
    return JSON.parse(localStorage.getItem(`sql-chat-messages-${id}`) || '[]')
  },
  set(id: string, messages: Message[]) {
    localStorage.setItem(`sql-chat-messages-${id}`, JSON.stringify(messages))
  },
}

function ChatMessage({ children, className, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cn('flex flex-col gap-2 mb-4 text-sm', className)} {...props}>
      {children}
    </div>
  )
}

function UserMessage({ text, ...props }: { text: string } & ComponentProps<'div'>) {
  return (
    <ChatMessage {...props}>
      <UserAvatar />
      <Markdown content={text} />
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

function AssistantMessage({ text, onEdit, ...props }: { text: string, onEdit?: (message: string) => void } & ComponentProps<'div'>) {
  return (
    <ChatMessage {...props}>
      <AssistantAvatar />
      <Markdown content={text} onEdit={onEdit} />
    </ChatMessage>
  )
}

export function SqlChat({ onEdit }: { onEdit: (message: string) => void }) {
  const { id } = useParams({ from: '/(protected)/_protected/database/$id' })
  const { data: database } = useDatabase(id)
  const { data: context } = useQuery({
    queryKey: ['database-context', id],
    queryFn: () => getDatabaseContext(database),
  })
  const { messages, stop, input, handleInputChange, handleSubmit, status, setMessages, error, reload } = useChat({
    id,
    api: `${import.meta.env.VITE_PUBLIC_API_URL}/ai/sql-chat`,
    initialMessages: chatMessages.get(id),
    initialInput: chatInput.get(id),
    body: {
      type: database.type,
      context,
    },
  })

  useEffect(() => {
    chatMessages.set(id, messages)
  }, [id, messages])

  useEffect(() => {
    chatInput.set(id, input)
  }, [id, input])

  return (
    <div className="relative flex h-screen flex-col justify-between gap-2 p-4">
      <DotsBg
        className="absolute -z-10 inset-0 [mask-image:linear-gradient(to_bottom_left,white,transparent,transparent)]"
      />
      <div className="flex justify-between items-center mb-4">
        <CardTitle>AI Assistant</CardTitle>
        {/* <Button variant="outline" size="icon">
          <RiHistoryLine className="size-4" />
        </Button> */}
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
      </div>
      {messages.length === 0 && !error && (
        <div className="pointer-events-none absolute z-10 inset-0 flex justify-center items-center px-6">
          <div className="pointer-events-auto text-center text-balance max-w-96">
            <RiQuestionAnswerLine className="mx-auto mb-2 size-8" />
            <p className="text-sm">Ask AI to generate SQL queries</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Try asking for
              {' '}
              <span className="font-mono">SELECT</span>
              {' '}
              queries to fetch data,
              {' '}
              <span className="font-mono">INSERT</span>
              {' '}
              statements to add records,
              {' '}
              <span className="font-mono">UPDATE</span>
              {' '}
              to modify existing data, or complex
              {' '}
              <span className="font-mono">JOIN</span>
              s across multiple tables.
            </p>
          </div>
        </div>
      )}
      <ScrollArea className="flex-1 overflow-y-auto -mx-4 px-4">
        <div className="flex flex-col gap-4 pb-2">
          {messages.map(message => (
            <Fragment key={message.id}>
              {message.role === 'user'
                ? <UserMessage text={message.content} />
                : <AssistantMessage text={message.content} onEdit={onEdit} />}
            </Fragment>
          ))}
          {status === 'submitted' && (
            <ChatMessage className="flex flex-col items-start gap-2">
              <AssistantAvatar />
              <p className="text-muted-foreground animate-pulse">Generating SQL query...</p>
            </ChatMessage>
          )}
          {error && (
            <ChatMessage>
              <AssistantAvatar />
              <p className="text-red-500">{error.message}</p>
              <div>
                <Button variant="outline" size="xs" onClick={() => reload()}>
                  <RiRefreshLine className="size-3" />
                  Try again
                </Button>
              </div>
            </ChatMessage>
          )}
        </div>
      </ScrollArea>
      <form
        className="flex gap-2"
        onSubmit={handleSubmit}
      >
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Generate SQL query using natural language"
        />
        <Button disabled={!input || status === 'submitted' || status === 'streaming'} type="submit" size="icon">
          <LoadingContent loading={status === 'submitted' || status === 'streaming'}>
            <RiSendPlane2Line />
          </LoadingContent>
        </Button>
        {(status === 'submitted' || status === 'streaming') && (
          <Button type="button" size="icon" variant="outline" onClick={stop}>
            <RiStopLine />
          </Button>
        )}
      </form>
    </div>
  )
}
