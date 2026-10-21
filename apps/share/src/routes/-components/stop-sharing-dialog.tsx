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
import { useState } from 'react'

export const StopSharingDialog = ({
  onClose,
  onStop,
  pending,
  share,
}: {
  onClose: () => void
  onStop: (id: string) => void
  pending: boolean
  share: { id: string; name: string } | null
}) => {
  const [shown, setShown] = useState(share)
  if (share && share !== shown) {
    setShown(share)
  }

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
              disabled={pending}
              onClick={() => share && onStop(share.id)}
            >
              <LoadingContent loading={pending}>Stop sharing</LoadingContent>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  )
}
