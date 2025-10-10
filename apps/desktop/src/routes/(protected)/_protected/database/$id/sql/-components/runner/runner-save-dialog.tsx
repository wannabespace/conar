import { Button } from '@conar/ui/components/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@conar/ui/components/dialog'
import { Input } from '@conar/ui/components/input'
import { Label } from '@conar/ui/components/label'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'
import { v7 } from 'uuid'
import { queriesCollection } from '~/entities/query'
import { Route } from '../..'

interface RunnerSaveDialogProps {
  ref: React.RefObject<{
    open: (query: string) => void
  } | null>
}

export function RunnerSaveDialog({ ref }: RunnerSaveDialogProps) {
  const { database } = Route.useRouteContext()
  const [name, setName] = useState('')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  useImperativeHandle(ref, () => ({
    open: (query: string) => {
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
      databaseId: database.id,
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
          <div className="text-sm text-muted-foreground mb-4">
            Saved queries are stored for this database and can be quickly accessed and run from the "Saved queries" panel.
          </div>
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
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">
              Cancel
            </Button>
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
