import { Refresh01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@tamery/ui/components/alert-dialog'
import { Button } from '@tamery/ui/components/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { queryClient } from '~/lib/query-client'

import type { ElectronMcp } from './electron-mcp'
import { statusQueryKey } from './electron-mcp'

export const RegenerateToken = ({ mcp }: { mcp: ElectronMcp }) => {
  const [open, setOpen] = useState(false)
  const { mutate: regenerate } = useMutation({
    meta: { event: 'mcp_token_regenerated' },
    mutationFn: () => mcp.regenerateToken(),
    onError: (error) => toast.error(error.message),
    onSuccess: (next) => {
      queryClient.setQueryData(statusQueryKey, next)
      setOpen(false)
    },
  })

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size="icon-xs"
              variant="ghost-muted"
              aria-label="Regenerate token"
              onClick={() => setOpen(true)}
            >
              <HugeiconsIcon icon={Refresh01Icon} />
            </Button>
          }
        />
        <TooltipContent side="bottom">Regenerate token</TooltipContent>
      </Tooltip>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate the access token?</AlertDialogTitle>
            <AlertDialogDescription>
              Every client using the current token loses access until you paste
              the new one into its config.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => regenerate()}
            >
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
