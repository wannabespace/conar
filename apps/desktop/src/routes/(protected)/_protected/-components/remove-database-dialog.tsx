import type { databases } from '~/drizzle'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@conar/ui/components/alert-dialog'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { useMutation } from '@tanstack/react-query'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'
import { removeDatabase } from '~/entities/database'

interface RemoveDatabaseDialogProps {
  ref?: React.RefObject<{
    remove: (database: typeof databases.$inferSelect) => void
  } | null>
}

export function RemoveDatabaseDialog({ ref }: RemoveDatabaseDialogProps) {
  const [open, setOpen] = useState(false)
  const [database, setDatabase] = useState<typeof databases.$inferSelect | null>(null)

  useImperativeHandle(ref, () => ({
    remove: (db: typeof databases.$inferSelect) => {
      setDatabase(db)
      setOpen(true)
    },
  }), [])

  const { mutate: remove, isPending } = useMutation({
    mutationFn: () => removeDatabase(database!.id),
    onSuccess: () => {
      toast.success('Database removed successfully')
      setOpen(false)
    },
  })

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove database</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this database
            and remove all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              e.preventDefault()
              remove()
            }}
            disabled={isPending}
          >
            <LoadingContent loading={isPending}>
              Remove
            </LoadingContent>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
