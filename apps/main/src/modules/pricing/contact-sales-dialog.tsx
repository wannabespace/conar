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
import { Field, FieldGroup, FieldLabel } from '@tamery/ui/components/field'
import { Input } from '@tamery/ui/components/input'
import { Textarea } from '@tamery/ui/components/textarea'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { authClient } from '~/lib/auth'
import { orpc } from '~/lib/orpc'

export const ContactSalesDialog = () => {
  const { data: session } = authClient.useSession()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const replyTo = email || session?.user.email || ''

  const { isPending, mutate } = useMutation(
    orpc.contactSales.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSuccess: () => {
        toast.success('Thanks! We will reply by email soon.')
        setOpen(false)
        setMessage('')
      },
    })
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" variant="outline" />}>
        Contact us
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tamery for your team</DialogTitle>
          <DialogDescription>
            Tell us about your team and databases. We will reply by email.
          </DialogDescription>
        </DialogHeader>
        <form
          id="contact-sales"
          onSubmit={(event) => {
            event.preventDefault()
            mutate({ email: replyTo, message })
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="contact-sales-email">Work email</FieldLabel>
              <Input
                id="contact-sales-email"
                type="email"
                required
                value={replyTo}
                placeholder="you@company.com"
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="contact-sales-message">Message</FieldLabel>
              <Textarea
                id="contact-sales-message"
                required
                value={message}
                placeholder="Team size, databases, what you need"
                onChange={(event) => setMessage(event.target.value)}
              />
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            type="submit"
            form="contact-sales"
            disabled={isPending || !replyTo || !message}
          >
            <LoadingContent loading={isPending}>Send</LoadingContent>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
