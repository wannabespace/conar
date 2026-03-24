import type { connections } from '~/drizzle/schema'
import { AlertDialog, AlertDialogClose, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@conar/ui/components/alert-dialog'
import { Button } from '@conar/ui/components/button'
import { toastManager } from '@conar/ui/components/toast'
import { useImperativeHandle, useState } from 'react'
import { connectionsCollection } from '~/entities/connection/sync'

interface RemoveConnectionDialogProps {
  ref?: React.RefObject<{
    remove: (connection: typeof connections.$inferSelect) => void
  } | null>
}

export function RemoveConnectionDialog({ ref }: RemoveConnectionDialogProps) {
  const [open, setOpen] = useState(false)
  const [connection, setConnection] = useState<typeof connections.$inferSelect | null>(null)

  useImperativeHandle(ref, () => ({
    remove: (connection: typeof connections.$inferSelect) => {
      setConnection(connection)
      setOpen(true)
    },
  }), [])

  function remove(e: React.MouseEvent<HTMLButtonElement>) {
    if (!connection)
      return

    e.preventDefault()
    connectionsCollection.delete(connection.id)
    toastManager.add({
      title: 'Connection removed successfully',
      type: 'success',
    })
    setOpen(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Connection</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this connection
            and remove all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="outline" />}>Cancel</AlertDialogClose>
          <AlertDialogClose
            render={<Button variant="destructive" />}
            onClick={remove}
          >
            Remove
          </AlertDialogClose>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
