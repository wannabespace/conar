import { Button } from '@conar/ui/components/button'
import { CardHeader, CardTitle } from '@conar/ui/components/card'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@conar/ui/components/resizable'
import { RiSidebarFoldLine, RiSidebarUnfoldLine } from '@remixicon/react'
import { useStore } from '@tanstack/react-store'
import { pageStore } from '../-lib'
import { RunnerEditor } from './runner-editor'
import { RunnerQueries } from './runner-queries'
import { RunnerResults } from './runner-results'

export function Runner() {
  const queriesOpen = useStore(pageStore, state => state.queriesOpen)

  return (
    <ResizablePanelGroup autoSaveId="sql-layout-y" direction="vertical">
      <ResizablePanel minSize={20}>
        <ResizablePanelGroup autoSaveId="sql-layout-x" direction="horizontal">
          <ResizablePanel minSize={50}>
            <CardHeader className="bg-card py-3 h-14">
              <CardTitle className="flex items-center gap-2 justify-between">
                SQL Queries Runner
                <div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      pageStore.setState(state => ({
                        ...state,
                        queriesOpen: !state.queriesOpen,
                      }))
                    }}
                  >
                    {queriesOpen ? 'Hide saved' : 'Show saved'}
                    {queriesOpen ? <RiSidebarUnfoldLine /> : <RiSidebarFoldLine />}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <RunnerEditor className="h-[calc(100%-theme(spacing.14))] flex-1" />
          </ResizablePanel>
          {queriesOpen && (
<>
            <ResizableHandle withHandle />
            <ResizablePanel maxSize={50} minSize={20} defaultSize={30}>
              <CardHeader className="py-3 h-14">
                <CardTitle className="flex items-center gap-2 justify-between">
                  Saved Queries
                </CardTitle>
              </CardHeader>
              <RunnerQueries className="h-[calc(100%-theme(spacing.14))] w-full" />
            </ResizablePanel>
</>
)}
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel minSize={20}>
        <RunnerResults />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
