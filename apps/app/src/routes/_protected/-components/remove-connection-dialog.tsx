import type { connections } from '~/drizzle/schema'
import { AlertDialog, AlertDialogClose, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@conar/ui/components/alert-dialog'
import { Button } from '@conar/ui/components/button'
import { eq, queryOnce } from '@tanstack/react-db'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'
import { connectionsCollection, connectionsResourcesCollection } from '~/entities/connection/sync'
import { lastOpenedResourcesStorageValue } from '~/entities/connection/utils'

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

  async function remove(e: React.MouseEvent<HTMLButtonElement>) {
    if (!connection)
      return

    e.preventDefault()

    const allConnectionsResources = await queryOnce(q => q
      .from({ connectionsResources: connectionsResourcesCollection })
      .select(({ connectionsResources }) => ({
        id: connectionsResources.id,
      }))
      .where(({ connectionsResources }) => eq(connectionsResources.connectionId, connection.id)))
    const resourcesIds = allConnectionsResources.map(({ id }) => id)

    lastOpenedResourcesStorageValue.set(prev => prev.filter(resource => !resourcesIds.includes(resource)))

    connectionsCollection.delete(connection.id)

    const idsToRemove = [...resourcesIds, connection.id]

    Object.keys(localStorage).forEach((key) => {
      if (idsToRemove.some(id => key.includes(id))) {
        localStorage.removeItem(key)
      }
    })

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
