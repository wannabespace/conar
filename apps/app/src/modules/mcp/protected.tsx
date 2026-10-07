import { McpServerIcon } from '@hugeicons/core-free-icons'
import { useEffect } from 'react'

import type { ProtectedModule } from '~/lib/module'

import type { ElectronMcp } from './mcp-settings'
import { McpSettings } from './mcp-settings'
import { mcpSource } from './mcp-source'

const desktopModule = (mcp: ElectronMcp): ProtectedModule => {
  const McpSourceMount = () => {
    useEffect(() => mcp.serve(mcpSource), [])

    return null
  }
  const Settings = () => <McpSettings mcp={mcp} />

  return {
    mounts: [McpSourceMount],
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
}

export default (window.electron
  ? desktopModule(window.electron.mcp)
  : {}) satisfies ProtectedModule
