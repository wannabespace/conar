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
import { Textarea } from '@tamery/ui/components/textarea'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { orpc } from '~/lib/orpc'

export function SupportDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [message, setMessage] = useState('')

  const { mutate: sendSupport, isPending: loading } = useMutation(
    orpc.contact.mutationOptions({
      onSuccess: () => {
        toast.success(
          'Support message sent successfully! We will get back to you as soon as possible.',
        )
        onOpenChange(false)
        setMessage('')
      },
      onError: err => {
        console.error(err)
        toast.error('Failed to send message. Please try again later.')
      },
    }),
  )

  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault()
    sendSupport({ message })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contact Support</DialogTitle>
          <DialogDescription>
            Have a question, suggestion, or need assistance? We're here to listen!
          </DialogDescription>
        </DialogHeader>
        <div>
          <form id="support-form" onSubmit={handleSubmit}>
            <Field>
              <FieldLabel htmlFor="support-message">Message</FieldLabel>
              <Textarea
                id="support-message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                placeholder="Type any message you'd like to send us"
                className="min-h-48"
              />
            </Field>
          </form>
        </div>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
          <Button type="submit" form="support-form" disabled={loading || !message}>
            <LoadingContent loading={loading}>Send</LoadingContent>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
