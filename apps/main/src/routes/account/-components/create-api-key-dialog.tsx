import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogPanel, DialogTitle } from '@conar/ui/components/dialog'
import { Field, FieldLabel } from '@conar/ui/components/field'
import { Input } from '@conar/ui/components/input'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import { toast } from 'sonner'
import { authClient } from '~/lib/auth'
import { handleError } from '~/utils/error'

export interface CreatedApiKey {
  id: string
  key: string
}

interface CreateApiKeyDialogProps {
  ref?: React.RefObject<{ open: () => void } | null>
  onCreated: (apiKey: CreatedApiKey) => void
  onRefetch: () => void
}

export function CreateApiKeyDialog({ ref, onCreated, onRefetch }: CreateApiKeyDialogProps) {
  const nameInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  useImperativeHandle(ref, () => ({
    open: () => {
      setOpen(true)
    },
  }), [])

  useEffect(() => {
    if (!open) {
      return
    }
    const id = requestAnimationFrame(() => nameInputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [open])

  const { mutate: createApiKey, isPending: isCreating } = useMutation({
    mutationFn: async (keyName: string) => {
      const { data, error } = await authClient.apiKey.create({ name: keyName })
      if (error)
        throw error
      return data
    },
    onSuccess: (data) => {
      onCreated({
        id: data.id,
        key: data.key,
      })
      setName('')
      setOpen(false)
      onRefetch()
      toast.success('API key created')
    },
    onError: handleError,
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setName('')
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create API key</DialogTitle>
          <DialogDescription>
            Name it so you can tell keys apart later.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <form
            id="create-api-key-form"
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (!name.trim()) {
                toast.error('Key name is required')
                return
              }
              createApiKey(name.trim())
            }}
          >
            <Field>
              <FieldLabel htmlFor="api-key-name">Name</FieldLabel>
              <Input
                ref={nameInputRef}
                id="api-key-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. local-mcp, ci-bot"
                maxLength={100}
              />
            </Field>
          </form>
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button type="submit" form="create-api-key-form" disabled={isCreating}>
            <LoadingContent loading={isCreating}>
              Create
            </LoadingContent>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
