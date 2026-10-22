import { Message01Icon } from '@hugeicons/core-free-icons'
import {
  SUPPORT_FAILED_MESSAGE,
  SUPPORT_SENT_MESSAGE,
} from '@tamery/shared/constants'
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

import { SidebarButton, SidebarIcon } from '~/components/sidebar-button'
import { orpc } from '~/lib/orpc'

export const SupportButton = () => {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')

  const { mutate: sendSupport, isPending: loading } = useMutation(
    orpc.contact.mutationOptions({
      meta: { event: 'support_message_sent' },
      onError: (err) => {
        console.error(err)
        toast.error(SUPPORT_FAILED_MESSAGE)
      },
      onSuccess: () => {
        toast.success(SUPPORT_SENT_MESSAGE)
        setOpen(false)
        setMessage('')
      },
    })
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendSupport({ message })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<SidebarButton />}>
        <SidebarIcon icon={Message01Icon} />
        Support
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contact support</DialogTitle>
          <DialogDescription>
            Questions, ideas or something broken? Write to us and we will reply
            by email.
          </DialogDescription>
        </DialogHeader>
        <form id="support-form" onSubmit={handleSubmit}>
          <Field>
            <FieldLabel htmlFor="support-message">Message</FieldLabel>
            <Textarea
              id="support-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="How can we help?"
              className="min-h-48"
            />
          </Field>
        </form>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            type="submit"
            form="support-form"
            disabled={loading || !message}
          >
            <LoadingContent loading={loading}>Send</LoadingContent>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
