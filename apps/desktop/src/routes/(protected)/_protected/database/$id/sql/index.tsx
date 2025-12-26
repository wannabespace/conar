import type { ComponentRef } from 'react'
import { title } from '@conar/shared/utils/title'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@conar/ui/components/resizable'
import { createFileRoute } from '@tanstack/react-router'
import { type } from 'arktype'
import { useEffect, useRef, useState } from 'react'
import { databaseStore } from '~/entities/database'
import { useSubscription } from '~/entities/user/hooks/use-subscription'
import { appStore } from '~/store'
import { Chat, createChat } from './-components/chat'
import { Runner } from './-components/runner'

export const Route = createFileRoute(
  '/(protected)/_protected/database/$id/sql/',
)({
  component: DatabaseSqlPage,
  validateSearch: type({
    'chatId?': 'string.uuid.v7 | undefined',
    'error?': 'string | undefined',
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    return {
      database: context.database,
      chat: await createChat({
        id: deps.chatId,
        database: context.database,
      }),
    }
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: title('SQL Runner', loaderData.database.name) }] : [],
  }),
})

const MIN_CHAT_SIZE = 20

function DatabaseSqlPage() {
  const { database } = Route.useLoaderData()
  const { chatId } = Route.useSearch()
  const store = databaseStore(database.id)
  const [isChatCollapsed, setIsChatCollapsed] = useState(false)
  const ref = useRef<ComponentRef<typeof ResizablePanelGroup>>(null)
  const { subscription } = useSubscription()

  useEffect(() => {
    store.setState(state => ({
      ...state,
      lastOpenedChatId: chatId ?? null,
    } satisfies typeof state))
  }, [chatId, store])

  return (
    <ResizablePanelGroup
      ref={ref}
      autoSaveId="sql-layout-x"
      direction="horizontal"
      className="flex"
      onLayout={([, chat = 0]) => {
        setIsChatCollapsed(chat === 0)
      }}
    >
      <ResizablePanel
        defaultSize={70}
        minSize={30}
        className="flex flex-col gap-4 rounded-lg border bg-background"
      >
        <Runner
          isChatCollapsed={isChatCollapsed}
          onChatClick={() => {
            if (!subscription) {
              appStore.setState(state => ({ ...state, subscriptionModalIsOpen: true } satisfies typeof state))
              return
            }

            if (isChatCollapsed) {
              ref.current?.setLayout([100 - MIN_CHAT_SIZE, MIN_CHAT_SIZE])
            }
            else {
              ref.current?.setLayout([100, 0])
            }
          }}
        />
      </ResizablePanel>
      {subscription && (
        <>
          <ResizableHandle className="w-1 bg-transparent" />
          <ResizablePanel
            defaultSize={30}
            minSize={MIN_CHAT_SIZE}
            maxSize={50}
            collapsible
            className="rounded-lg border bg-background"
          >
            <Chat className="h-full" />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}
