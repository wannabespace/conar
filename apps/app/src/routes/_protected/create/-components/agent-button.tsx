import { McpServerIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'

import { useMcpServer } from '~/modules/mcp/use-mcp-server'

/** Desktop only: the MCP status query has no data on the web. */
export const AgentButton = ({ onClick }: { onClick: () => void }) => {
  const { setEnabled, status } = useMcpServer()

  return (
    <Button
      type="button"
      variant="link-muted"
      size="sm"
      className="self-start"
      onClick={() => {
        if (status?.state !== 'running') {
          setEnabled(true)
        }
        onClick()
      }}
    >
      <HugeiconsIcon icon={McpServerIcon} strokeWidth={2} />
      Add via MCP
    </Button>
  )
}
