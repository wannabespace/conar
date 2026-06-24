import type { Query } from '~/entities/query/sync'
import { AlertDialog, AlertDialogClose, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@conar/ui/components/alert-dialog'
import { Button } from '@conar/ui/components/button'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'
import { useCollections } from '~/entities/connection/collections'

interface RemoveQueryDialogProps {
  ref?: React.RefObject<{
    remove: (query: Query) => void
  } | null>
}

export function RemoveQueryDialog({ ref }: RemoveQueryDialogProps) {
  const { queriesCollection } = useCollections()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState<Query | null>(null)

  useImperativeHandle(ref, () => ({
    remove: (q: Query) => {
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
          <AlertDialogTitle>Remove Query</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove
            {' '}
            <span className="font-semibold">{query?.name}</span>
            ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="outline" />}>Cancel</AlertDialogClose>
          <AlertDialogClose
            render={<Button variant="destructive" />}
            onClick={removeQuery}
          >
            Remove
          </AlertDialogClose>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
