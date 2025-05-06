import type { Message, UseChatHelpers } from '@ai-sdk/react'
import type { ComponentProps } from 'react'
import { Avatar, AvatarFallback } from '@connnect/ui/components/avatar'
import { Button } from '@connnect/ui/components/button'
import { copy } from '@connnect/ui/lib/copy'
import { cn } from '@connnect/ui/lib/utils'
import { RiFileCopyLine, RiRefreshLine, RiRestartLine } from '@remixicon/react'
import { Fragment } from 'react'
import { Markdown } from '~/components/markdown'
import { UserAvatar } from '~/entities/user'
import { sleep } from '~/lib/helpers'
import { pageHooks, pageStore } from '..'
import { ChatImages } from './chat-images'

interface attachment {
  name?: string
  url: string
}

function ChatMessage({ children, className, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cn('flex flex-col gap-2 mb-4 text-sm', className)} {...props}>
      {children}
    </div>
  )
}

function UserMessage({ text, attachments, ...props }: { text: string, attachments?: attachment[] } & ComponentProps<'div'>) {
  return (
    <ChatMessage {...props}>
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
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="xs"
          onClick={() => {
            copy(text, 'Message copied to clipboard')
          }}
        >
          <RiFileCopyLine className="size-3" />
          Copy
        </Button>
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
    <ChatMessage {...props}>
      <AssistantAvatar />
      <Markdown
        content={text}
        onEdit={handleEdit}
        loading={loading}
      />
      <div className="flex items-center gap-2">
        {last && (
          <Button
            variant="outline"
            size="xs"
            onClick={onReload}
          >
            <RiRestartLine className="size-3" />
            Generate again
          </Button>
        )}
        <Button
          variant="outline"
          size="xs"
          onClick={() => {
            copy(text, 'Message copied to clipboard')
          }}
        >
          <RiFileCopyLine className="size-3" />
          Copy
        </Button>
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
            ? (
                <UserMessage
                  text={message.content}
                  attachments={message.experimental_attachments}
                />
              )
            : (
                <AssistantMessage
                  text={message.content}
                  last={status === 'ready' && index === messages.length - 1}
                  loading={(status === 'submitted' || status === 'streaming') && index === messages.length - 1}
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
