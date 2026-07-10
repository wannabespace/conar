import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@conar/ui/components/alert-dialog'
import { Button } from '@conar/ui/components/button'
import { eq, queryOnce } from '@tanstack/react-db'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'

import { useCollections } from '~/entities/collections'
import type { Connection } from '~/entities/connection/core'
import { lastOpenedResourcesStorageValue } from '~/entities/connection/utils'

interface RemoveConnectionDialogProps {
  ref?: React.RefObject<{
    remove: (connection: Connection) => void
  } | null>
}

export function RemoveConnectionDialog({ ref }: RemoveConnectionDialogProps) {
  const collections = useCollections()
  const [open, setOpen] = useState(false)
  const [connection, setConnection] = useState<Connection | null>(null)

  useImperativeHandle(
    ref,
    () => ({
      remove: (connection: Connection) => {
        setConnection(connection)
        setOpen(true)
      },
    }),
    [],
  )

  async function remove(e: React.MouseEvent<HTMLButtonElement>) {
    if (!connection) return

    e.preventDefault()

    const { connectionsCollection, connectionsResourcesCollection } = collections
    const allConnectionsResources = await queryOnce((q) =>
      q
        .from({ connectionsResources: connectionsResourcesCollection })
        .select(({ connectionsResources }) => ({
          id: connectionsResources.id,
        }))
        .where(({ connectionsResources }) => eq(connectionsResources.connectionId, connection.id)),
    )
    const resourcesIds = allConnectionsResources.map(({ id }) => id)

    lastOpenedResourcesStorageValue.set((prev) => prev.filter((resource) => !resourcesIds.includes(resource)))

    connectionsCollection.delete(connection.id)

    const idsToRemove = [...resourcesIds, connection.id]

    Object.keys(localStorage).forEach((key) => {
      if (idsToRemove.some((id) => key.includes(id))) {
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
            This action cannot be undone. This will permanently delete this connection and remove all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="outline" />}>Cancel</AlertDialogClose>
          <AlertDialogClose render={<Button variant="destructive" />} onClick={remove}>
            Remove
          </AlertDialogClose>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
