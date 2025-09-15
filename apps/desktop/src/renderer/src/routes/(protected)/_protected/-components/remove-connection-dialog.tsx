import type { databases } from '~/drizzle'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@conar/ui/components/alert-dialog'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'
import { databasesCollection } from '~/entities/database'

interface RemoveConnectionDialogProps {
  ref?: React.RefObject<{
    remove: (database: typeof databases.$inferSelect) => void
  } | null>
}

export function RemoveConnectionDialog({ ref }: RemoveConnectionDialogProps) {
  const [open, setOpen] = useState(false)
  const [database, setDatabase] = useState<typeof databases.$inferSelect | null>(null)

  useImperativeHandle(ref, () => ({
    remove: (db: typeof databases.$inferSelect) => {
      setDatabase(db)
      setOpen(true)
    },
  }), [])

  function remove(e: React.MouseEvent<HTMLButtonElement>) {
    if (!database)
      return

    e.preventDefault()
    databasesCollection.delete(database.id)
    toast.success('Connection removed successfully')
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
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={remove}
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
