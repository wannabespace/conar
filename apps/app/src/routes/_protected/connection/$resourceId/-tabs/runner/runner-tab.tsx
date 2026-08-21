import { getRouteApi } from '@tanstack/react-router'

import { Runner } from './-components/runner'
import { RunnerTabContext } from './-lib/store'

const routeApi = getRouteApi('/_protected/connection/$resourceId/$tabId')

export const RunnerTab = ({ tabId }: { tabId: string }) => {
  const { connectionResource } = routeApi.useRouteContext()
  const tab = { resourceId: connectionResource.id, tabId }

  return (
    <RunnerTabContext value={tab}>
      <Runner />
    </RunnerTabContext>
  )
}
