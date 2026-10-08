import { createFileRoute, notFound } from '@tanstack/react-router'

import { McpSettings } from '~/modules/mcp/mcp-settings'

export const Route = createFileRoute('/_protected/settings/mcp')({
  beforeLoad: () => {
    if (!window.electron) {
      throw notFound()
    }
  },
  component: McpSettings,
})
