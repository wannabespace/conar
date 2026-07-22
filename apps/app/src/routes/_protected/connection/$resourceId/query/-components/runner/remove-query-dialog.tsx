import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@tamery/ui/components/alert-dialog'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'

import { useCollections } from '~/entities/collections'
import type { Query } from '~/entities/query/sync'

interface RemoveQueryDialogProps {
  ref?: React.RefObject<{
    remove: (query: Query) => void
  } | null>
}

export function RemoveQueryDialog({ ref }: RemoveQueryDialogProps) {
  const { queriesCollection } = useCollections()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState<Query | null>(null)

  useImperativeHandle(
    ref,
    () => ({
      remove: (q: Query) => {
        setQuery(q)
        setOpen(true)
      },
    }),
    [],
  )

  function removeQuery() {
    if (!query) return

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
            Are you sure you want to remove{' '}
            <span data-mask className="font-semibold">
              {query?.name}
            </span>
            ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
          <AlertDialogCancel variant="destructive" onClick={removeQuery}>
            Remove
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
