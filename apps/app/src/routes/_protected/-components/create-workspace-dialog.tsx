import { Button } from '@tamery/ui/components/button'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@tamery/ui/components/dialog'
import { Field, FieldLabel } from '@tamery/ui/components/field'
import { Input } from '@tamery/ui/components/input'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { authClient } from '~/lib/auth'

const workspaceSlug = (name: string) => {
  const base =
    name
      .toLowerCase()
      .trim()
      .replaceAll(/[^a-z0-9]+/gu, '-')
      .replaceAll(/^-+|-+$/gu, '')
      .slice(0, 32) || 'workspace'
  const suffix = Math.random().toString(36).slice(2, 10)

  return `${base}-${suffix}`
}

export const CreateWorkspaceDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) => {
  const navigate = useNavigate()
  const [name, setName] = useState('')

  const { mutate: createWorkspace, isPending: loading } = useMutation({
    mutationFn: async (workspaceName: string) => {
      const { data, error } = await authClient.organization.create({
        name: workspaceName,
        slug: workspaceSlug(workspaceName),
      })

      if (error) {
        throw new Error(error.message ?? 'Failed to create workspace')
      }

      await authClient.organization.setActive({ organizationId: data.id })

      return data
    },
    onSuccess: async () => {
      toast.success('Workspace created')
      onOpenChange(false)
      setName('')
      await navigate({ to: '/' })
    },
    onError: (err: Error) => {
      console.error(err)
      toast.error(
        err.message || 'Failed to create workspace. Please try again later.'
      )
    },
  })

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault()
    createWorkspace(name.trim())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
          <DialogDescription>
            Workspaces keep your connections organized in separate groups.
          </DialogDescription>
        </DialogHeader>
        <form id="create-workspace-form" onSubmit={handleSubmit}>
          <Field>
            <FieldLabel htmlFor="workspace-name">Name</FieldLabel>
            <Input
              id="workspace-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              placeholder="My workspace"
              data-mask
            />
          </Field>
        </form>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            type="submit"
            form="create-workspace-form"
            disabled={loading || !name.trim()}
          >
            <LoadingContent loading={loading}>Create</LoadingContent>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
