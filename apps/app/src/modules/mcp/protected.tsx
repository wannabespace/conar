import { McpServerIcon } from '@hugeicons/core-free-icons'
import { useEffect } from 'react'

import type { ProtectedModule } from '~/lib/module'

import { McpSettings } from './mcp-settings'
import { mcpSource } from './mcp-source'

const McpSourceMount = () => {
  useEffect(() => window.electron?.mcp.serve(mcpSource), [])

  return null
}

export default (window.electron
  ? {
      mounts: [McpSourceMount],
      settings: [
        {
          Component: McpSettings,
          icon: McpServerIcon,
          id: 'mcp',
          label: 'MCP',
          order: 10,
        },
      ],
    }
  : {}) satisfies ProtectedModule
