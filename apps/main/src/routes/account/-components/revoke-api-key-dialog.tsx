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
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { useMutation } from '@tanstack/react-query'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'

import { authClient } from '~/lib/auth'
import { handleError } from '~/utils/error'

interface RevokeApiKeyDialogProps {
  ref?: React.RefObject<{ revoke: (keyId: string) => void } | null>
  onRefetch: () => void
}

export function RevokeApiKeyDialog({ ref, onRefetch }: RevokeApiKeyDialogProps) {
  const [open, setOpen] = useState(false)
  const [keyId, setKeyId] = useState<string | null>(null)

  useImperativeHandle(
    ref,
    () => ({
      revoke: (id: string) => {
        setKeyId(id)
        setOpen(true)
      },
    }),
    [],
  )

  const { mutate: deleteApiKey, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await authClient.apiKey.delete({ keyId: id })
      if (error) throw error
    },
    onSuccess: () => {
      setOpen(false)
      setKeyId(null)
      onRefetch()
      toast.success('API key revoked')
    },
    onError: handleError,
  })

  return (
    <AlertDialog
      open={open}
      onOpenChange={nextOpen => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setKeyId(null)
        }
      }}
    >
      <AlertDialogContent className="sm:max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke this API key?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Any integration using this key will stop working
            immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="outline" />}>Cancel</AlertDialogClose>
          <Button
            variant="destructive"
            disabled={isDeleting || !keyId}
            onClick={() => {
              if (keyId) deleteApiKey(keyId)
            }}
          >
            <LoadingContent loading={isDeleting}>Revoke</LoadingContent>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
