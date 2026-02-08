import { Button } from '@conar/ui/components/button'
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
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { authClient } from '~/lib/auth'
import { handleError } from '~/utils/error'

export function DisableTfaDialog({ open, onOpenChange }: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [password, setPassword] = useState('')
  const { mutate, isPending } = useMutation({
    mutationFn: async (password: string) => {
      const { error } = await authClient.twoFactor.disable({ password })

      if (error) {
        throw error
      }
    },
    onSuccess: async () => {
      toast.success('2FA disabled')
      onOpenChange(false)
    },
    onError: handleError,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-sm"
        onSubmit={(e) => {
          e.preventDefault()
          mutate(password)
        }}
        render={<form />}
      >

        <DialogHeader>
          <DialogTitle>Disable 2FA</DialogTitle>
          <DialogDescription>
            Enter your password to turn off two-factor authentication.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel className="flex flex-col gap-2">
          <Label htmlFor="disable-password">Password</Label>
          <Input
            id="disable-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={isPending}
            autoComplete="current-password"
            autoFocus
          />
        </DialogPanel>
        <DialogFooter>
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
            className="
              w-full
              sm:w-auto
            "
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="destructive"
            className="
              w-full
              sm:w-auto
            "
            disabled={isPending || password.length === 0}
          >
            <LoadingContent loading={isPending}>Disable</LoadingContent>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
