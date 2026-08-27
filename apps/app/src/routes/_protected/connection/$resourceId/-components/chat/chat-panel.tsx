import {
  RiChatNewLine,
  RiCheckLine,
  RiCloseLine,
  RiHistoryLine,
} from '@remixicon/react'
import { messagesFromRows } from '@tamery/ai/v2/message'
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
import type { UIMessage } from '@tanstack/ai-react'
import { stream, useChat } from '@tanstack/ai-react'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useSubscription } from 'seitu/react'
import { v7 } from 'uuid'

import { useCollections } from '~/entities/collections'
import { getConnectionResourceStore } from '~/entities/connection/store'
import { orpc } from '~/lib/orpc'

import { ChatInput } from './chat-input'
import { ChatMessages } from './chat-messages'
import {
  CHAT_DEFAULT_WIDTH,
  CHAT_MAX_WIDTH,
  CHAT_MIN_WIDTH,
  chatStore,
} from './store'

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
  <div className="flex h-10 shrink-0 items-center gap-0.5 border-b pr-1.5 pl-3">
    <span data-mask className="min-w-0 flex-1 truncate text-sm font-medium">
      {title ?? 'New Chat'}
    </span>
    {history.length > 0 && (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button size="icon-sm" variant="ghost" aria-label="Chat history" />
          }
        >
          <RiHistoryLine className="size-4" />
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
                {chat.title ?? 'New Chat'}
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
              size="icon-sm"
              variant="ghost"
              aria-label={label}
              onClick={onClick}
            />
          }
        >
          <Icon className="size-4" />
        </TooltipTrigger>
        <TooltipContent side="bottom">{label}</TooltipContent>
      </Tooltip>
    ))}
  </div>
)

const createChatConnection = (data: {
  chatId: string
  connectionResourceId: string
}) =>
  stream(
    async function* runTurn(messages, _forwarded, signal) {
      yield* await orpc.chats.v2.stream.call(
        {
          chatId: data.chatId,
          connectionResourceId: data.connectionResourceId,
          messages,
        },
        { signal }
      )
    },
    {
      async *joinRun(runId: string, signal?: AbortSignal) {
        yield* await orpc.chats.v2.join.call({ streamId: runId }, { signal })
      },
    }
  )

const ChatSession = ({
  chatId,
  collectionMessages,
  connectionResourceId,
  resumeRunId,
}: {
  chatId: string
  collectionMessages: UIMessage[]
  connectionResourceId: string
  resumeRunId: string | null
}) => {
  const { chatsCollection } = useCollections()
  // oxlint-disable-next-line react/hook-use-state -- built once per mount, never replaced
  const [connection] = useState(() =>
    createChatConnection({ chatId, connectionResourceId })
  )
  const { error, isLoading, messages, reload, sendMessage, setMessages, stop } =
    useChat({
      connection,
      initialMessages: collectionMessages,
      ...(resumeRunId && {
        initialResumeSnapshot: {
          resumeState: { runId: resumeRunId, threadId: chatId },
        },
      }),
      onFinish: async () => {
        if (chatsCollection.get(chatId)?.title) {
          return
        }

        try {
          await orpc.ai.generateTitle.call({ chatId })
        } catch {
          // nothing
        }
      },
      threadId: chatId,
    })

  useEffect(() => {
    if (!isLoading && collectionMessages.length > messages.length) {
      setMessages(collectionMessages)
    }
  }, [collectionMessages, isLoading, messages.length, setMessages])

  return (
    <>
      <ChatMessages
        isPending={!error && (isLoading || messages.at(-1)?.role === 'user')}
        messages={messages}
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
              void reload()
            }}
          >
            Retry
          </Button>
        </div>
      )}
      <ChatInput
        isStreaming={isLoading}
        onSend={(text) => {
          sendMessage(text)
        }}
        onStop={() => {
          // Leaving only detaches; the stream belongs to the server until told.
          void orpc.chats.v2.abortStream.call({ chatId })
          stop()
        }}
      />
    </>
  )
}

const Chat = ({
  chatId,
  connectionResourceId,
}: {
  chatId: string
  connectionResourceId: string
}) => {
  const store = getConnectionResourceStore(connectionResourceId)
  const {
    chatsCollection,
    chatsMessagesCollection,
    chatsMessagesPartsCollection,
  } = useCollections()
  const { data: resume } = useQuery(
    orpc.chats.v2.resume.queryOptions({
      input: { chatId },
    })
  )
  const { data: chat } = useLiveQuery({
    query: (q) =>
      q
        .from({ chats: chatsCollection })
        .where(({ chats }) => eq(chats.id, chatId))
        .findOne(),
  })
  const { data: chatHistory } = useLiveQuery({
    query: (q) =>
      q
        .from({ chats: chatsCollection })
        .where(({ chats }) =>
          eq(chats.connectionResourceId, connectionResourceId)
        )
        .orderBy(({ chats }) => chats.createdAt, 'desc'),
  })
  const { data: transcriptRows } = useLiveQuery({
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

  const resumeRunId = resume?.streamId ?? null

  return (
    <>
      <ChatHeader
        activeChatId={chatId}
        history={chatHistory}
        title={chat?.title ?? null}
        onClose={() =>
          store.set(
            (state) => ({ ...state, chatOpened: false }) satisfies typeof state
          )
        }
        onNewChat={() =>
          store.set(
            (state) => ({ ...state, chatId: v7() }) satisfies typeof state
          )
        }
        onSelectChat={(nextChatId) =>
          store.set(
            (state) => ({ ...state, chatId: nextChatId }) satisfies typeof state
          )
        }
      />
      <ChatSession
        key={resumeRunId ?? chatId}
        chatId={chatId}
        collectionMessages={messagesFromRows(transcriptRows)}
        connectionResourceId={connectionResourceId}
        resumeRunId={resumeRunId}
      />
    </>
  )
}

export const ChatPanel = () => {
  const { connectionResource } = useRouteContext()
  const store = getConnectionResourceStore(connectionResource.id)
  const chatOpened = useSubscription(store, {
    selector: (state) => state.chatOpened ?? false,
  })
  const chatId = useSubscription(store, {
    selector: (state) => state.chatId ?? null,
  })
  const width = useSubscription(chatStore, {
    selector: (state) => state.width,
  })
  const [isResizing, setIsResizing] = useState(false)

  // Fallback only: the toggle mints the id so the panel opens with content on
  // its first frame. This catches a stored `chatOpened` with no id.
  useEffect(() => {
    if (chatOpened && !chatId) {
      store.set((state) => ({ ...state, chatId: v7() }) satisfies typeof state)
    }
  }, [chatOpened, chatId, store])

  return (
    <motion.div
      initial={false}
      animate={{ width: chatOpened ? width : 0 }}
      transition={
        isResizing
          ? { duration: 0 }
          : { duration: 0.25, ease: [0.32, 0.72, 0, 1] }
      }
      className="relative h-full shrink-0 overflow-hidden"
    >
      <div className="h-full pl-2" style={{ width }}>
        <div className="bg-background flex h-full min-w-0 flex-col overflow-hidden rounded-xl border shadow-lg">
          {chatId && (
            <Chat
              key={chatId}
              chatId={chatId}
              connectionResourceId={connectionResource.id}
            />
          )}
        </div>
      </div>
      {chatOpened && (
        <ResizeHandle
          side="left"
          aria-label="Resize chat panel"
          className="absolute inset-y-0 -left-0.5 z-10 flex w-3 justify-center"
          getValue={() => chatStore.get().width}
          min={CHAT_MIN_WIDTH}
          max={CHAT_MAX_WIDTH}
          onResize={(value) =>
            chatStore.set(
              (state) => ({ ...state, width: value }) satisfies typeof state
            )
          }
          onResizingChange={setIsResizing}
          onDoubleClick={() =>
            chatStore.set(
              (state) =>
                ({ ...state, width: CHAT_DEFAULT_WIDTH }) satisfies typeof state
            )
          }
        >
          <div className="group-hover/resize-handle:bg-border group-data-resizing/resize-handle:bg-primary/40 h-full w-[2px] rounded-xs transition-colors" />
        </ResizeHandle>
      )}
    </motion.div>
  )
}
