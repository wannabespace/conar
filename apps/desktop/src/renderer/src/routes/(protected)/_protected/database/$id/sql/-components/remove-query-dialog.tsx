import type { queries } from '~/drizzle'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@conar/ui/components/alert-dialog'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { useMutation } from '@tanstack/react-query'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'
import { removeQuery } from '~/entities/query'

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

  const { mutate: remove, isPending } = useMutation({
    mutationFn: () => removeQuery(query!.id),
    onSuccess: () => {
      toast.success('Query removed successfully')
      setOpen(false)
    },
  })

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
