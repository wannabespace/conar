import { useChat } from '@ai-sdk/react'
import {
  RiChatNewLine,
  RiCheckLine,
  RiCloseLine,
  RiHistoryLine,
} from '@remixicon/react'
import {
  textFromMessage,
  messagesFromRows,
  mergeMessages,
} from '@tamery/ai/message'
import { Button } from '@tamery/ui/components/button'
import { ResizeHandle } from '@tamery/ui/components/custom/resize-handle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@tamery/ui/components/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { getRouteApi } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'
import { v7 } from 'uuid'

import { useCollections } from '~/entities/collections'
import { getConnectionResourceStore } from '~/entities/connection/store'
import { orpc } from '~/lib/orpc'

import { ChatInput } from './chat-input'
import { getChatInstance } from './chat-instance'
import { ChatMessages } from './chat-messages'
import {
  CHAT_DEFAULT_WIDTH,
  CHAT_MAX_WIDTH,
  CHAT_MIN_WIDTH,
  chatWidthValue,
} from './constants'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const ChatHeader = ({
  activeChatId,
  history,
  onClose,
  onNewChat,
  onSelectChat,
  title,
}: {
  activeChatId: string
  history: { id: string; title: string | null }[]
  onClose: () => void
  onNewChat: () => void
  onSelectChat: (chatId: string) => void
  title: string | null
}) => (
  <div className="flex h-8 shrink-0 items-center gap-0.5 border-b pr-1 pl-3">
    <span data-mask className="min-w-0 flex-1 truncate text-sm font-medium">
      {title || 'New Chat'}
    </span>
    {history.length > 0 && (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button size="icon-xs" variant="ghost" aria-label="Chat history" />
          }
        >
          <RiHistoryLine className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="max-h-[70vh] min-w-56 overflow-auto"
        >
          {history.map((chat) => (
            <DropdownMenuItem
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
            >
              <span data-mask className="truncate">
                {chat.title || 'New Chat'}
              </span>
              {chat.id === activeChatId && (
                <RiCheckLine className="text-muted-foreground ml-auto size-4" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )}
    {[
      { Icon: RiChatNewLine, label: 'New chat', onClick: onNewChat },
      { Icon: RiCloseLine, label: 'Close chat', onClick: onClose },
    ].map(({ Icon, label, onClick }) => (
      <Tooltip key={label}>
        <TooltipTrigger
          render={
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label={label}
              onClick={onClick}
            />
          }
        >
          <Icon className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent side="bottom">{label}</TooltipContent>
      </Tooltip>
    ))}
  </div>
)

const Chat = ({
  chatId,
  connectionResourceId,
  isNew,
  onNewChat,
  onSelectChat,
  onStart,
}: {
  chatId: string
  connectionResourceId: string
  isNew: boolean
  onNewChat: () => void
  onSelectChat: (chatId: string) => void
  onStart: () => void
}) => {
  const store = getConnectionResourceStore(connectionResourceId)
  const {
    chatsCollection,
    chatsMessagesCollection,
    chatsMessagesPartsCollection,
  } = useCollections()
  const { data: chatHistory } = useLiveQuery({
    query: (q) =>
      q
        .from({ chats: chatsCollection })
        .where(({ chats }) =>
          eq(chats.connectionResourceId, connectionResourceId)
        )
        .orderBy(({ chats }) => chats.createdAt, 'desc'),
  })
  const { data: transcriptRows, isReady: isTranscriptReady } = useLiveQuery({
    query: (q) =>
      q
        .from({ messages: chatsMessagesCollection })
        .innerJoin(
          { parts: chatsMessagesPartsCollection },
          ({ messages, parts }) => eq(parts.messageId, messages.id)
        )
        .where(({ messages }) => eq(messages.chatId, chatId))
        .orderBy(({ messages }) => messages.createdAt, 'asc')
        .select(({ messages, parts }) => ({
          messageId: messages.id,
          metadata: messages.metadata,
          order: parts.order,
          part: parts.part,
          role: messages.role,
        })),
  })

  const chat = chatHistory.find((row) => row.id === chatId)
  const collectionMessages = messagesFromRows(transcriptRows)

  // oxlint-disable-next-line react/hook-use-state
  const [resume] = useState(
    () => !isNew && collectionMessages.at(-1)?.role !== 'assistant'
  )
  const { error, messages, regenerate, sendMessage, status, stop } = useChat({
    chat: getChatInstance({ chatId, connectionResourceId }),
    resume,
  })
  const isStreaming = status === 'submitted' || status === 'streaming'
  const displayMessages = mergeMessages(collectionMessages, messages)
  const firstMessage = displayMessages.at(0)
  const pendingTitle = firstMessage ? textFromMessage(firstMessage) : null
  const sentHereIds = new Set(
    messages
      .filter((message) => message.role === 'user')
      .map((message) => message.id)
  )

  return (
    <>
      <ChatHeader
        activeChatId={chatId}
        history={chatHistory}
        title={chat?.title || pendingTitle}
        onClose={() =>
          store.set(
            (state) => ({ ...state, chatOpened: false }) satisfies typeof state
          )
        }
        onNewChat={onNewChat}
        onSelectChat={onSelectChat}
      />
      <ChatMessages
        isPending={
          !error &&
          (status === 'streaming' || displayMessages.at(-1)?.role === 'user')
        }
        isReady={isTranscriptReady}
        messages={displayMessages}
        sentHereIds={sentHereIds}
      />
      {error && (
        <div className="flex shrink-0 items-center gap-2 px-3 pb-1">
          <p className="text-destructive min-w-0 flex-1 truncate text-xs">
            {error.message}
          </p>
          <Button
            size="xs"
            variant="outline"
            onClick={() => {
              void regenerate()
            }}
          >
            Retry
          </Button>
        </div>
      )}
      <ChatInput
        isStreaming={isStreaming}
        onSend={(text) => {
          onStart()
          void sendMessage({
            id: v7(),
            parts: [{ text, type: 'text' }],
            role: 'user',
          })
        }}
        onStop={() => {
          void orpc.ai.abortStream.call({ chatId })
          stop()
        }}
      />
    </>
  )
}

export const ChatPanel = () => {
  const { connectionResource } = useRouteContext()
  const store = getConnectionResourceStore(connectionResource.id)
  const chatId = useSubscription(store, {
    selector: (state) => state.chatId ?? null,
  })
  const chatOpened = useSubscription(store, {
    selector: (state) => state.chatOpened ?? false,
  })
  const width = useSubscription(chatWidthValue)
  const [isResizing, setIsResizing] = useState(false)
  const [draftId, setDraftId] = useState(() => v7())
  const activeChatId = chatId ?? draftId

  const startDraft = () =>
    store.set(
      (state) =>
        ({ ...state, chatId: state.chatId ?? draftId }) satisfies typeof state
    )

  const openBlankChat = () => {
    if (!chatId) {
      return
    }
    setDraftId(v7())
    store.set((state) => ({ ...state, chatId: null }) satisfies typeof state)
  }

  return (
    <motion.div
      initial={false}
      animate={{ width: chatOpened ? width : 0 }}
      transition={
        isResizing
          ? { duration: 0 }
          : {
              duration: 0.25,
              ease: [0.32, 0.72, 0, 1],
            }
      }
      className="relative h-full shrink-0"
    >
      <div className="flex h-full flex-col pl-1.5" style={{ width }}>
        <div className="bg-background flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-lg">
          <Chat
            key={activeChatId}
            chatId={activeChatId}
            connectionResourceId={connectionResource.id}
            isNew={activeChatId === draftId}
            onNewChat={openBlankChat}
            onStart={startDraft}
            onSelectChat={(id) =>
              store.set(
                (state) => ({ ...state, chatId: id }) satisfies typeof state
              )
            }
          />
        </div>
      </div>
      {chatOpened && (
        <ResizeHandle
          aria-label="Resize chat"
          side="left"
          className="absolute inset-y-0 left-0 z-10 flex w-2 justify-center"
          getValue={chatWidthValue.get}
          min={CHAT_MIN_WIDTH}
          max={CHAT_MAX_WIDTH}
          onResize={(value) => chatWidthValue.set(value)}
          onResizingChange={setIsResizing}
          onDoubleClick={() => chatWidthValue.set(CHAT_DEFAULT_WIDTH)}
        >
          <div className="group-hover/resize-handle:bg-border group-data-resizing/resize-handle:bg-primary/40 h-full w-[2px] rounded-xs transition-colors" />
        </ResizeHandle>
      )}
    </motion.div>
  )
}
