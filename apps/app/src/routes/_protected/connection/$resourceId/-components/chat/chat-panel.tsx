import { useChat } from '@ai-sdk/react'
import {
  textFromMessage,
  messagesFromRows,
  mergeMessages,
} from '@tamery/ai/message'
import { Button } from '@tamery/ui/components/button'
import { eq, useLiveSuspenseQuery } from '@tanstack/react-db'
import { getRouteApi } from '@tanstack/react-router'
import { Suspense, useState } from 'react'
import { useSubscription } from 'seitu/react'
import { v7 } from 'uuid'

import { useCollections } from '~/entities/collections'
import { getConnectionResourceStore } from '~/entities/connection/store'
import { orpc } from '~/lib/orpc'
import { resourcePanelClassName } from '~/shell'

import { ChatHeader } from './chat-header'
import { ChatInput } from './chat-input'
import { getChatInstance } from './chat-instance'
import { ChatMessages } from './chat-messages'
import { ChatSkeleton } from './chat-skeleton'
import { CHAT_DEFAULT_WIDTH } from './constants'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const Chat = ({
  chatId,
  connectionResourceId,
  onNewChat,
}: {
  chatId: string
  connectionResourceId: string
  onNewChat: () => void
}) => {
  const store = getConnectionResourceStore(connectionResourceId)
  const setChatId = (id: string | null) =>
    store.set((state) => ({ ...state, chatId: id }) satisfies typeof state)
  const {
    chatsCollection,
    chatsMessagesCollection,
    chatsMessagesPartsCollection,
  } = useCollections()
  const { data: chatHistory } = useLiveSuspenseQuery({
    query: (q) =>
      q
        .from({ chats: chatsCollection })
        .where(({ chats }) =>
          eq(chats.connectionResourceId, connectionResourceId)
        )
        .orderBy(({ chats }) => chats.createdAt, 'desc'),
  })
  const { data: transcriptRows } = useLiveSuspenseQuery({
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
    () => !!chat && collectionMessages.at(-1)?.role !== 'assistant'
  )
  const { error, messages, regenerate, sendMessage, status, stop } = useChat({
    chat: getChatInstance({ chatId, connectionResourceId }),
    resume,
  })
  const isStreaming = status === 'submitted' || status === 'streaming'
  const displayMessages = mergeMessages(collectionMessages, messages)
  const firstMessage = displayMessages.at(0)
  const pendingTitle = firstMessage ? textFromMessage(firstMessage) : null
  const lastSentId = messages.findLast((message) => message.role === 'user')?.id
  const retry = () => {
    if (messages.length > 0) {
      void regenerate()
      return
    }

    const lastAsked = displayMessages.findLast(
      (message) => message.role === 'user'
    )
    if (lastAsked) {
      void sendMessage(lastAsked)
    }
  }

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
        onSelectChat={setChatId}
      />
      <ChatMessages
        isPending={isStreaming}
        messages={displayMessages}
        lastSentId={lastSentId}
      />
      {error && (
        <div className="flex shrink-0 items-center gap-2 px-3 pb-1">
          <p className="text-destructive min-w-0 flex-1 truncate text-xs">
            {error.message}
          </p>
          <Button size="xs" variant="outline" onClick={retry}>
            Retry
          </Button>
        </div>
      )}
      <ChatInput
        isStreaming={isStreaming}
        onSend={(text) => {
          setChatId(chatId)
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
  const [draftId, setDraftId] = useState(() => v7())

  const openBlankChat = () => {
    if (!chatId) {
      return
    }
    setDraftId(v7())
    store.set((state) => ({ ...state, chatId: null }) satisfies typeof state)
  }

  if (!chatOpened) {
    return null
  }

  return (
    <div
      className="flex h-full shrink-0 flex-col pl-1.5"
      style={{ width: CHAT_DEFAULT_WIDTH }}
    >
      <div className={resourcePanelClassName}>
        <Suspense fallback={<ChatSkeleton />}>
          <Chat
            key={chatId ?? draftId}
            chatId={chatId ?? draftId}
            connectionResourceId={connectionResource.id}
            onNewChat={openBlankChat}
          />
        </Suspense>
      </div>
    </div>
  )
}
