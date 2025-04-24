import type { Message, UseChatHelpers } from '@ai-sdk/react'
import type { ComponentProps } from 'react'
import { Avatar, AvatarFallback } from '@connnect/ui/components/avatar'
import { Button } from '@connnect/ui/components/button'
import { cn } from '@connnect/ui/lib/utils'
import { RiRefreshLine } from '@remixicon/react'
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

function UserMessage({ text, images, ...props }: { text: string, images: { name: string, url: string }[] } & ComponentProps<'div'>) {
  return (
    <ChatMessage {...props}>
      <UserAvatar className="size-6" />
      <Markdown content={text} />
      {images.length > 0 && <ChatImages images={images} imageClassName="size-8" />}
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

function AssistantMessage({ text, ...props }: { text: string } & ComponentProps<'div'>) {
  return (
    <ChatMessage {...props}>
      <AssistantAvatar />
      <Markdown
        content={text}
        onEdit={async (query) => {
          pageStore.setState(state => ({
            ...state,
            query,
          }))
          await sleep(0)
          pageHooks.callHook('focusRunner')
        }}
      />
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
      {messages.map(message => (
        <Fragment key={message.id}>
          {message.role === 'user'
            ? (
                <UserMessage
                  text={message.content}
                  images={message.experimental_attachments?.map(attachment => ({
                    name: attachment.name ?? '',
                    url: attachment.url,
                  })) ?? []}
                />
              )
            : <AssistantMessage text={message.content} />}
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
      {error && (
        <ChatMessage>
          <AssistantAvatar />
          <p className="text-red-500">{error.message}</p>
          <div>
            <Button variant="outline" size="xs" onClick={onReload}>
              <RiRefreshLine className="size-3" />
              Try again
            </Button>
          </div>
        </ChatMessage>
      )}
    </div>
  )
}
