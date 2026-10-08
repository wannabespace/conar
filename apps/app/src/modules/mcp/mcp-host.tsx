import { useEffect } from 'react'

import { ApprovalDialog } from './approval-dialog'
import { mcp } from './electron-mcp'
import { LimitDialog } from './limit-dialog'
import { mcpSource } from './mcp-source'

export const McpHost = () => {
  useEffect(() => mcp.serve(mcpSource), [])

  return (
    <>
      <ApprovalDialog />
      <LimitDialog />
    </>
  )
}
