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
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import { stopSharing } from '~/lib/account'

export const StopSharingDialog = ({
  onClose,
  share,
}: {
  onClose: () => void
  share: { id: string; name: string } | null
}) => {
  const router = useRouter()
  const [shown, setShown] = useState(share)
  if (share && share !== shown) {
    setShown(share)
  }
  const stop = useMutation({
    mutationFn: (id: string) => stopSharing({ data: { id } }),
    onSuccess: async () => {
      await router.invalidate()
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
              disabled={stop.isPending}
              onClick={() => share && stop.mutate(share.id)}
            >
              <LoadingContent loading={stop.isPending}>
                Stop sharing
              </LoadingContent>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  )
}
