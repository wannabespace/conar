import type { databases } from '~/drizzle'
import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
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
import { useMutation } from '@tanstack/react-query'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'
import { createQuery } from '~/entities/query'

interface SaveQueryDialogProps {
  ref: React.RefObject<{
    open: (query: string) => void
  } | null>
  database: typeof databases.$inferSelect
}

export function SaveQueryDialog({ ref, database }: SaveQueryDialogProps) {
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

  const { mutate, isPending } = useMutation({
    mutationFn: () => createQuery({ database, name, query }),
    onSuccess: async () => {
      toast.success(`Query "${name}" successfully created`)
      setOpen(false)
    },
  })

  const canConfirm = name.trim() && !isPending

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
                mutate()
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
                mutate()
              }
            }}
          >
            <LoadingContent loading={isPending}>
              Save Query
            </LoadingContent>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
