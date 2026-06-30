import { Alert, AlertDescription } from '@tamery/ui/components/alert'
import { Button } from '@tamery/ui/components/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@tamery/ui/components/dialog'
import { Input } from '@tamery/ui/components/input'
import { Label } from '@tamery/ui/components/label'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'
import { v7 } from 'uuid'
import { useCollections } from '~/entities/collections'
import { Route } from '../..'

interface RunnerSaveDialogProps {
  ref: React.RefObject<{
    open: (query: string) => void
  } | null>
}

export function RunnerSaveDialog({ ref }: RunnerSaveDialogProps) {
  const { queriesCollection } = useCollections()
  const { connectionResource } = Route.useRouteContext()
  const [name, setName] = useState('')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  useImperativeHandle(ref, () => ({
    open: (query) => {
      setName('')
      setOpen(true)
      setQuery(query)
    },
  }))

  function createQuery() {
    queriesCollection.insert({
      id: v7(),
      createdAt: new Date(),
      updatedAt: new Date(),
      connectionResourceId: connectionResource.id,
      name,
      query,
    })
    toast.success(`Query "${name}" successfully created`)
    setOpen(false)
  }

  const canConfirm = !!name.trim()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Save Query
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              Saved queries are stored for this database and can be quickly accessed and run from the "Saved queries" panel.
            </AlertDescription>
          </Alert>
          <Label htmlFor="name">
            Query name
          </Label>
          <Input
            id="name"
            value={name}
            placeholder="Enter query name"
            spellCheck={false}
            autoComplete="off"
            onChange={e => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canConfirm) {
                createQuery()
              }
            }}
          />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            disabled={!canConfirm}
            onClick={() => {
              if (canConfirm) {
                createQuery()
              }
            }}
          >
            Save Query
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
