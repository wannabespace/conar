import { Delete02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@tamery/ui/components/card'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@tamery/ui/components/dialog'
import { Input } from '@tamery/ui/components/input'
import { Label } from '@tamery/ui/components/label'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { authClient } from '~/lib/auth'
import { handleError } from '~/utils/error'

const DeleteAccountDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) => {
  const router = useRouter()
  const [confirmation, setConfirmation] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.deleteUser({
        callbackURL: '/sign-in',
      })

      if (error) {
        throw error
      }
    },
    onError: handleError,
    onSuccess: () => {
      toast.success('Account deleted successfully')
      router.navigate({ to: '/sign-in' })
    },
  })

  const isConfirmed = confirmation === 'delete'

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setConfirmation('')
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-sm"
        onSubmit={(e) => {
          e.preventDefault()
          mutate()
        }}
        render={<form />}
      >
        <DialogHeader>
          <DialogTitle>Delete account</DialogTitle>
          <DialogDescription>
            This action is permanent and cannot be undone. All your data,
            including your subscription, settings, and sessions will be
            permanently removed.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="delete-confirmation">
              Type <span className="font-mono font-semibold">delete</span> to
              confirm
            </Label>
            <Input
              id="delete-confirmation"
              type="text"
              placeholder="delete"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              disabled={isPending}
              autoComplete="off"
              // oxlint-disable-next-line no-autofocus
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            type="button"
            onClick={() => handleOpenChange(false)}
            className="w-full sm:w-auto"
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="destructive"
            className="w-full sm:w-auto"
            disabled={!isConfirmed || isPending}
          >
            <LoadingContent loading={isPending}>
              <HugeiconsIcon
                icon={Delete02Icon}
                strokeWidth={2}
                className="size-4"
              />
              Delete account
            </LoadingContent>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const DeleteAccountCard = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <DeleteAccountDialog open={open} onOpenChange={setOpen} />
      <Card>
        <CardHeader>
          <CardTitle>Delete account</CardTitle>
          <CardDescription>
            Permanently remove your account and all associated data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setOpen(true)}>
            <HugeiconsIcon
              icon={Delete02Icon}
              strokeWidth={2}
              className="size-4"
            />
            Delete account
          </Button>
        </CardContent>
      </Card>
    </>
  )
}
