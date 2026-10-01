import { getRouteApi } from '@tanstack/react-router'

import type { WorkspaceModule } from '~/lib/module'

import { Runner } from './components/runner'
import { RunnerTabContext } from './lib/store'

const { useRouteContext } = getRouteApi(
  '/_protected/connection/$resourceId/$tabId'
)

const RunnerTab = ({ id: tabId }: { id: string }) => {
  const { connectionResource } = useRouteContext()

  return (
    <RunnerTabContext value={{ resourceId: connectionResource.id, tabId }}>
      <Runner />
    </RunnerTabContext>
  )
}

export default {
  tabs: { runner: { Content: RunnerTab } },
} satisfies WorkspaceModule
