import { Button } from '@conar/ui/components/button'
import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from '@conar/ui/components/card'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
} from '@conar/ui/components/dialog'
import { Input } from '@conar/ui/components/input'
import { Label } from '@conar/ui/components/label'
import { RiDeleteBinLine } from '@remixicon/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { authClient } from '~/lib/auth'
import { handleError } from '~/utils/error'

function DeleteAccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')

  const { data: hasCredentialAccount = false } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => authClient.listAccounts(),
    select: (data) => data.data?.some((account) => account.providerId === 'credential') ?? false,
  })

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.deleteUser({
        callbackURL: '/sign-in',
        ...(password ? { password } : {}),
      })

      if (error) {
        throw error
      }
    },
    onSuccess: () => {
      toast.success('Account deleted successfully')
      router.navigate({ to: '/sign-in' })
    },
    onError: handleError,
  })

  const isConfirmed = confirmation === 'delete'
  const canSubmit = isConfirmed && (!hasCredentialAccount || password.length > 0)

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setPassword('')
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
            This action is permanent and cannot be undone. All your data, including your
            subscription, settings, and sessions will be permanently removed.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel className="flex flex-col gap-4">
          {hasCredentialAccount && (
            <div className="space-y-2">
              <Label htmlFor="delete-password">Password</Label>
              <Input
                id="delete-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                autoComplete="current-password"
                // oxlint-disable-next-line no-autofocus
                autoFocus
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="delete-confirmation">
              Type <span className="font-mono font-semibold">delete</span> to confirm
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
              autoFocus={!hasCredentialAccount}
            />
          </div>
        </DialogPanel>
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
            disabled={!canSubmit || isPending}
          >
            <LoadingContent loading={isPending}>
              <RiDeleteBinLine className="size-4" />
              Delete account
            </LoadingContent>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function DeleteAccountCard() {
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
        <CardPanel className="space-y-4">
          <Button variant="destructive" onClick={() => setOpen(true)}>
            <RiDeleteBinLine className="size-4" />
            Delete account
          </Button>
        </CardPanel>
      </Card>
    </>
  )
}
