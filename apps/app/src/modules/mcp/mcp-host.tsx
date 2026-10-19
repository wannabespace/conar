import { useEffect } from 'react'

import { posthog } from '~/lib/posthog'

import { ApprovalDialog } from './approval-dialog'
import { LimitDialog } from './limit-dialog'
import { mcpSource } from './mcp-source'

export const McpHost = () => {
  useEffect(() => window.electron?.mcp.serve(mcpSource), [])
  useEffect(
    () =>
      window.electron?.app.onKeptRunningOnQuit(() =>
        posthog.capture('mcp_kept_running_on_quit')
      ),
    []
  )

  return (
    <>
      <ApprovalDialog />
      <LimitDialog />
    </>
  )
}
