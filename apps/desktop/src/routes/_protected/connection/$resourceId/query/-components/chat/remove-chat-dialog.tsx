import type { chats } from '~/drizzle'
import { AlertDialog, AlertDialogClose, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@conar/ui/components/alert-dialog'
import { Button } from '@conar/ui/components/button'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'
import { chatsCollection } from '~/entities/chat/sync'

interface RemoveChatDialogProps {
  ref?: React.RefObject<{
    remove: (chat: typeof chats.$inferSelect, onRemove?: () => void) => void
  } | null>
}

export function RemoveChatDialog({ ref }: RemoveChatDialogProps) {
  const [open, setOpen] = useState(false)
  const [chat, setChat] = useState<typeof chats.$inferSelect | null>(null)
  const [onRemoveCallback, setOnRemoveCallback] = useState<(() => void) | null>(null)

  useImperativeHandle(ref, () => ({
    remove: (c: typeof chats.$inferSelect, onRemove?: () => void) => {
      setChat(c)
      setOnRemoveCallback(() => onRemove ?? null)
      setOpen(true)
    },
  }), [])

  function remove(e: React.MouseEvent<HTMLButtonElement>) {
    if (!chat)
      return

    e.preventDefault()
    const chatTitle = chat.title?.trim()
    chatsCollection.delete(chat.id)
    toast.success(
      chatTitle
        ? `Chat "${chatTitle}" deleted`
        : 'Chat deleted',
    )
    onRemoveCallback?.()
    setOpen(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Chat</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete
            {chat?.title
              ? (
                  <span className="font-semibold">
                    {' '}
                    "
                    {chat.title}
                    "
                  </span>
                )
              : (
                  ' this chat'
                )}
            {' '}
            and all its messages.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="outline" />}>Cancel</AlertDialogClose>
          <AlertDialogClose render={<Button variant="destructive" />} onClick={remove}>
            Delete
          </AlertDialogClose>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
