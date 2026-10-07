import { McpServerIcon } from '@hugeicons/core-free-icons'
import { useEffect } from 'react'

import type { ProtectedModule } from '~/lib/module'

import { ApprovalDialog } from './approval-dialog'
import { McpSettings } from './mcp-settings'
import { mcpSource } from './mcp-source'

const McpSourceMount = () => {
  useEffect(() => window.electron?.mcp.serve(mcpSource), [])

  return null
}

const Settings = () =>
  window.electron ? <McpSettings mcp={window.electron.mcp} /> : null

export default (window.electron
  ? {
      mounts: [McpSourceMount, ApprovalDialog],
      settings: [
        {
          Component: Settings,
          icon: McpServerIcon,
          id: 'mcp',
          label: 'MCP',
          order: 10,
        },
      ],
    }
  : {}) satisfies ProtectedModule
