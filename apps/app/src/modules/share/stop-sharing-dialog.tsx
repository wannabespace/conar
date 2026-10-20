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
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { orpc } from '~/lib/orpc'
import { queryClient } from '~/lib/query-client'

import type { Share } from './shares-query'
import { sharesQueryOptions } from './shares-query'

export const StopSharingDialog = ({
  onClose,
  share,
}: {
  onClose: () => void
  share: Share | null
}) => {
  const [shown, setShown] = useState(share)
  if (share && share !== shown) {
    setShown(share)
  }
  const remove = useMutation({
    meta: { event: 'share_removed' },
    mutationFn: (id: string) => orpc.shares.remove.call({ id }),
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: sharesQueryOptions.queryKey,
      })
      onClose()
    },
  })

  return (
    <AlertDialog
      open={!!share}
      onOpenChange={(open) => !open && onClose()}
      onOpenChangeComplete={(open) => !open && setShown(null)}
    >
      {shown && (
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop sharing?</AlertDialogTitle>
            <AlertDialogDescription>
              The link to{' '}
              <span data-mask className="text-foreground font-medium">
                {shown.name}
              </span>{' '}
              stops working for everyone. Sharing the table again makes a new
              link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => share && remove.mutate(share.id)}
            >
              <LoadingContent loading={remove.isPending}>
                Stop sharing
              </LoadingContent>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  )
}
