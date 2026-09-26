import { getRouteApi } from '@tanstack/react-router'

import { Runner } from './-components/runner'
import { RunnerTabContext } from './-lib/store'

const { useRouteContext } = getRouteApi(
  '/_protected/connection/$resourceId/$tabId'
)

export const RunnerTab = ({ tabId }: { tabId: string }) => {
  const { connectionResource } = useRouteContext()

  return (
    <RunnerTabContext value={{ resourceId: connectionResource.id, tabId }}>
      <Runner />
    </RunnerTabContext>
  )
}
