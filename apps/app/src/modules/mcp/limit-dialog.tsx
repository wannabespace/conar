import { LinkSquare02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { FREE_WEEKLY_LIMITS, usageResetsAt } from '@tamery/shared/usage'
import { Button } from '@tamery/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@tamery/ui/components/dialog'
import { format } from 'date-fns'
import { useSubscription } from 'seitu/react'

import { accountUrl } from '~/lib/urls'

import { limitDialog } from './usage'

const close = () => limitDialog.set({ open: false })

export const LimitDialog = () => {
  const { open } = useSubscription(limitDialog)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => limitDialog.set({ open: next })}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Agents used this week&rsquo;s queries</DialogTitle>
          <DialogDescription>
            The free plan includes {FREE_WEEKLY_LIMITS.mcp} agent queries a week
            through MCP. They come back on{' '}
            {format(usageResetsAt(), 'EEEE, MMMM d')}, or upgrade to Pro for no
            limit.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Later
          </Button>
          <Button
            render={
              <a
                href={accountUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Upgrade to Pro"
              />
            }
            onClick={close}
          >
            Upgrade to Pro
            <HugeiconsIcon
              icon={LinkSquare02Icon}
              strokeWidth={2}
              data-icon="inline-end"
            />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
