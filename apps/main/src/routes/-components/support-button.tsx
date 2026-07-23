import { RiMessageLine } from '@remixicon/react'
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
  DialogTrigger,
} from '@tamery/ui/components/dialog'
import { Field, FieldLabel } from '@tamery/ui/components/field'
import { Textarea } from '@tamery/ui/components/textarea'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { orpc } from '~/lib/orpc'

import { SidebarButton } from './sidebar-button'

export function SupportButton() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')

  const { mutate: sendSupport, isPending: loading } = useMutation(
    orpc.contact.mutationOptions({
      onSuccess: () => {
        toast.success(
          'Support message sent successfully! We will get back to you as soon as possible.',
        )
        setOpen(false)
        setMessage('')
      },
      onError: err => {
        console.error(err)
        toast.error('Failed to send message. Please try again later.')
      },
    }),
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendSupport({ message })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<SidebarButton />}>
        <RiMessageLine className="size-4" />
        Support
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contact Support</DialogTitle>
          <DialogDescription>
            Have a question, suggestion, or need assistance? We're here to listen!
          </DialogDescription>
        </DialogHeader>
        <div>
          <form onSubmit={handleSubmit} className="space-y-2">
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
          <Button type="submit" disabled={loading || !message}>
            <LoadingContent loading={loading}>Send</LoadingContent>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
