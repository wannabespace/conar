import type { AiSqlChatModel } from '@connnect/shared/enums/ai-chat-model'
import { title } from '@connnect/shared/utils/title'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@connnect/ui/components/resizable'
import { createFileRoute } from '@tanstack/react-router'
import { Store } from '@tanstack/react-store'
import { createHooks } from 'hookable'
import { databaseQuery } from '~/entities/database'
import { queryClient } from '~/main'
import { Chat } from './-components/chat'
import { queryStorage, Runner } from './-components/runnner'

export const pageStore = new Store({
  query: '',
  files: [] as File[],
  model: 'auto' as AiSqlChatModel | 'auto',
})

export const pageHooks = createHooks<{
  fix: (error: string) => Promise<void>
  focusRunner: () => void
}>()

export const Route = createFileRoute(
  '/(protected)/_protected/database/$id/sql/',
)({
  component: RouteComponent,
  beforeLoad: ({ params }) => {
    pageStore.setState(state => ({
      ...state,
      query: queryStorage.get(params.id),
    }))
  },
  loader: async ({ params }) => {
    const database = await queryClient.ensureQueryData(databaseQuery(params.id))
    return { database }
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: title('SQL Runner', loaderData.database.name),
      },
    ],
  }),
})

function RouteComponent() {
  return (
    <ResizablePanelGroup autoSaveId="sql-layout-x" direction="horizontal" className="flex h-auto!">
      <ResizablePanel defaultSize={30} minSize={20} maxSize={50} className="bg-muted/20">
        <Chat />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel
        minSize={30}
        maxSize={80}
        className="flex flex-col gap-4"
      >
        <Runner />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
