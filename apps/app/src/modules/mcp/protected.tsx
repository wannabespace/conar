import { McpServerIcon } from '@hugeicons/core-free-icons'
import { useEffect } from 'react'

import type { ProtectedModule } from '~/lib/module'

import { ApprovalDialog } from './approval-dialog'
import { mcp } from './electron-mcp'
import { LimitDialog } from './limit-dialog'
import { McpSettings } from './mcp-settings'
import { mcpSource } from './mcp-source'

const McpSourceMount = () => {
  useEffect(() => mcp.serve(mcpSource), [])

  return null
}

export default (window.electron
  ? {
      mounts: [McpSourceMount, ApprovalDialog, LimitDialog],
      settings: [
        {
          component: McpSettings,
          icon: McpServerIcon,
          label: 'MCP',
          order: 10,
          slug: 'mcp',
        },
      ],
    }
  : {}) satisfies ProtectedModule
