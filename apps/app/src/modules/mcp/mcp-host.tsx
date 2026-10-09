import { useEffect } from 'react'

import { ApprovalDialog } from './approval-dialog'
import { LimitDialog } from './limit-dialog'
import { mcpSource } from './mcp-source'

export const McpHost = () => {
  useEffect(() => window.electron?.mcp.serve(mcpSource), [])

  return (
    <>
      <ApprovalDialog />
      <LimitDialog />
    </>
  )
}
