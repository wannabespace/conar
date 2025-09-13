import type { queries } from '~/drizzle'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@conar/ui/components/alert-dialog'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'
import { queriesCollection } from '~/entities/query'

interface RemoveQueryDialogProps {
  ref?: React.RefObject<{
    remove: (query: typeof queries.$inferSelect) => void
  } | null>
}

export function RemoveQueryDialog({ ref }: RemoveQueryDialogProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState<typeof queries.$inferSelect | null>(null)

  useImperativeHandle(ref, () => ({
    remove: (q: typeof queries.$inferSelect) => {
      setQuery(q)
      setOpen(true)
    },
  }), [])

  function removeQuery() {
    if (!query)
      return

    queriesCollection.delete(query.id)
    toast.success('Query removed successfully')
    setOpen(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove query</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this query.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              e.preventDefault()
              removeQuery()
            }}
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
