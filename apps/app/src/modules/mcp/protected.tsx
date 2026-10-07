import { McpServerIcon } from '@hugeicons/core-free-icons'
import { useEffect } from 'react'

import type { ProtectedModule } from '~/lib/module'

import type { ElectronMcp } from './mcp-settings'
import { McpSettings } from './mcp-settings'
import { mcpSource } from './mcp-source'

const McpSource = ({ mcp }: { mcp: ElectronMcp }) => {
  useEffect(() => mcp.serve(mcpSource), [mcp])

  return null
}

// React Compiler hoists hook callbacks out of nested components, dropping this closure — hooks go in McpSource/McpSettings, which take `mcp` as a prop.
const desktopModule = (mcp: ElectronMcp): ProtectedModule => {
  const McpSourceMount = () => <McpSource mcp={mcp} />
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
