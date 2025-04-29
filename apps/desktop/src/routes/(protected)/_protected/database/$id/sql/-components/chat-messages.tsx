import type { Message, UseChatHelpers } from '@ai-sdk/react'
import type { ComponentProps } from 'react'
import { Avatar, AvatarFallback } from '@connnect/ui/components/avatar'
import { Button } from '@connnect/ui/components/button'
import { cn } from '@connnect/ui/lib/utils'
import { RiRefreshLine, RiRestartLine } from '@remixicon/react'
import { Fragment } from 'react'
import { Markdown } from '~/components/markdown'
import { UserAvatar } from '~/entities/user'
import { sleep } from '~/lib/helpers'
import { pageHooks, pageStore } from '..'
import { ChatImages } from './chat-images'

function ChatMessage({ children, className, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cn('flex flex-col gap-2 mb-4 text-sm', className)} {...props}>
      {children}
    </div>
  )
}

function UserMessage({ message, ...props }: { message: Message } & ComponentProps<'div'>) {
  return (
    <ChatMessage {...props}>
      <UserAvatar className="size-6" />
      <Markdown content={message.content} />
      {!!message.experimental_attachments && message.experimental_attachments.length > 0 && (
        <ChatImages
          images={message.experimental_attachments.map(attachment => ({
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
    <Avatar className="size-6">
      <AvatarFallback className="text-xs">AI</AvatarFallback>
    </Avatar>
  )
}

function AssistantMessage({ message, last, onReload, ...props }: { message: Message, last: boolean, onReload: () => void } & ComponentProps<'div'>) {
  return (
    <ChatMessage {...props}>
      <AssistantAvatar />
      <Markdown
        content={message.content}
        onEdit={async (query) => {
          pageStore.setState(state => ({
            ...state,
            query,
          }))
          await sleep(0)
          pageHooks.callHook('focusRunner')
        }}
      />
      {last && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="xs" onClick={onReload}>
            <RiRestartLine className="size-3" />
            Generate again
          </Button>
        </div>
      )}
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
  messages,
  status,
  error,
  onReload,
}: {
  messages: Message[]
  status: UseChatHelpers['status']
  error?: Error
  onReload: () => void
}) {
  return (
    <div className="flex flex-col gap-4 pb-2">
      {messages.map((message, index) => (
        <Fragment key={message.id}>
          {message.role === 'user'
            ? <UserMessage message={message} />
            : (
                <AssistantMessage
                  message={message}
                  last={status === 'ready' && index === messages.length - 1}
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
  )
}
