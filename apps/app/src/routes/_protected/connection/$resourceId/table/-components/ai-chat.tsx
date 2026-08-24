import type { AppUIMessage } from '@conar/ai/tools/helpers'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@conar/ui/components/ai/conversation'
import { Message, MessageContent } from '@conar/ui/components/ai/message'
import {
  PromptInput,
  PromptInputLoader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
} from '@conar/ui/components/ai/prompt-input'
import { Button } from '@conar/ui/components/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@conar/ui/components/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@conar/ui/components/tooltip'
import { RiAddLine, RiSparkling2Line } from '@remixicon/react'
import type { UIMessage } from '@tanstack/ai-client'
import { useChat, webSocket } from '@tanstack/ai-react'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { getRouteApi } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { v7 as uuid } from 'uuid'

import { Markdown } from '~/components/markdown'
import type { ChatMessage } from '~/entities/chat/sync'
import { createChatMessageAction } from '~/entities/chat/sync'
import { useCollections } from '~/entities/collections'
import { apiUrl } from '~/utils/utils'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const wsUrl = `${apiUrl.replace(/^http/, 'ws')}/v2/ai/chat`

function messagePartsText(parts: UIMessage['parts']) {
  return parts
    .filter(part => part.type === 'text')
    .map(part => part.content)
    .join('')
}

function toInitialMessages(stored: ChatMessage[]): UIMessage[] {
  return stored.map(message => ({
    id: message.id,
    role: message.role,
    parts: message.parts
      .filter(part => part.type === 'text')
      .map(part => ({ type: 'text' as const, content: part.text })),
  }))
}

function ChatLoader({ chatId }: { chatId: string }) {
  const { chatsMessagesCollection } = useCollections()

  const { data: storedMessages, isReady } = useLiveQuery(
    q =>
      q
        .from({ chatsMessages: chatsMessagesCollection })
        .where(({ chatsMessages }) => eq(chatsMessages.chatId, chatId))
        .orderBy(({ chatsMessages }) => chatsMessages.createdAt, 'asc'),
    [chatsMessagesCollection, chatId],
  )

  if (!isReady) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <PromptInputLoader />
      </div>
    )
  }

  return <ChatView chatId={chatId} initialMessages={toInitialMessages(storedMessages ?? [])} />
}

function ChatView({ chatId, initialMessages }: { chatId: string; initialMessages: UIMessage[] }) {
  const { connectionResource } = useRouteContext()
  const { chatsMessagesCollection } = useCollections()
  const [input, setInput] = useState('')

  const { messages, sendMessage, isLoading, stop, error } = useChat({
    connection: webSocket(wsUrl),
    initialMessages,
    onFinish: message => {
      const text = messagePartsText(message.parts)

      if (!text) {
        return
      }

      const now = new Date()

      chatsMessagesCollection.insert({
        id: uuid(),
        chatId,
        role: 'assistant',
        parts: [{ type: 'text', text }] as AppUIMessage['parts'],
        metadata: null,
        createdAt: now,
        updatedAt: now,
      })
    },
  })

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const text = input.trim()

    if (!text || isLoading) {
      return
    }

    const now = new Date()

    createChatMessageAction({
      chat: {
        id: chatId,
        connectionResourceId: connectionResource.id,
        title: null,
        createdAt: now,
        updatedAt: now,
      },
      message: {
        id: uuid(),
        chatId,
        role: 'user',
        parts: [{ type: 'text', text }] as AppUIMessage['parts'],
        metadata: null,
        createdAt: now,
        updatedAt: now,
      },
    })

    sendMessage(text)
    setInput('')
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Conversation>
        <ConversationContent>
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center">
              <RiSparkling2Line className="size-8 text-primary/60" />
              <p className="text-sm font-medium">Ask me anything</p>
              <p className="max-w-60 text-xs text-muted-foreground">
                Questions about your database, SQL, or anything else.
              </p>
            </div>
          )}
          {messages.map(message => (
            <Message key={message.id} from={message.role}>
              <MessageContent>
                {message.role === 'assistant' ? (
                  <Markdown id={message.id} content={messagePartsText(message.parts)} />
                ) : (
                  messagePartsText(message.parts)
                )}
              </MessageContent>
            </Message>
          ))}
          {isLoading && messages.at(-1)?.role === 'user' && (
            <Message from="assistant">
              <MessageContent>
                <PromptInputLoader />
              </MessageContent>
            </Message>
          )}
          {error && <p className="text-xs text-destructive">{error.message}</p>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="p-3 pt-0">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            autoFocus
            placeholder="Ask AI..."
            value={input}
            onChange={event => setInput(event.target.value)}
          />
          <PromptInputToolbar>
            <span className="px-2 text-[10px] text-muted-foreground">
              Enter to send, Shift+Enter for a new line
            </span>
            <PromptInputSubmit
              status={isLoading ? 'streaming' : 'ready'}
              disabled={!isLoading && !input.trim()}
              onClick={isLoading ? () => stop() : undefined}
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  )
}

export function AiChat() {
  const { connectionResource } = useRouteContext()
  const { chatsCollection } = useCollections()
  const [open, setOpen] = useState(false)
  const [manualChatId, setManualChatId] = useState<string | null>(null)

  const { data: chats } = useLiveQuery(
    q =>
      q
        .from({ chats: chatsCollection })
        .where(({ chats }) => eq(chats.connectionResourceId, connectionResource.id))
        .orderBy(({ chats }) => chats.createdAt, 'desc'),
    [chatsCollection, connectionResource.id],
  )

  const fallbackChatId = useMemo(() => uuid(), [])
  const chatId = manualChatId ?? chats?.[0]?.id ?? fallbackChatId

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Open AI chat">
              <RiSparkling2Line className="text-primary" />
            </Button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">AI Chat</TooltipContent>
      </Tooltip>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between gap-2 pr-8">
            <SheetTitle className="flex items-center gap-2 text-base">
              <RiSparkling2Line className="size-4.5 text-primary" />
              AI Chat
            </SheetTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="New chat"
                  onClick={() => setManualChatId(uuid())}
                >
                  <RiAddLine />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">New chat</TooltipContent>
            </Tooltip>
          </div>
          <SheetDescription className="sr-only">Chat with AI about your database</SheetDescription>
        </SheetHeader>
        {open && <ChatLoader key={chatId} chatId={chatId} />}
      </SheetContent>
    </Sheet>
  )
}
