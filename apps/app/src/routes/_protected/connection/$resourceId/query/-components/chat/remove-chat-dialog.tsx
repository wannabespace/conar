import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@tamery/ui/components/alert-dialog'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'

import type { Chat } from '~/entities/chat/sync'
import { useCollections } from '~/entities/collections'

interface RemoveChatDialogProps {
  ref?: React.RefObject<{
    remove: (chat: Chat, onRemove?: () => void) => void
  } | null>
}

export function RemoveChatDialog({ ref }: RemoveChatDialogProps) {
  const { chatsCollection } = useCollections()
  const [open, setOpen] = useState(false)
  const [chat, setChat] = useState<Chat | null>(null)
  const [onRemoveCallback, setOnRemoveCallback] = useState<(() => void) | null>(null)

  useImperativeHandle(
    ref,
    () => ({
      remove: (chat: Chat, onRemove?: () => void) => {
        setChat(chat)
        setOnRemoveCallback(() => onRemove ?? null)
        setOpen(true)
      },
    }),
    [],
  )

  function remove(e: React.MouseEvent<HTMLButtonElement>) {
    if (!chat) return

    e.preventDefault()
    const chatTitle = chat.title?.trim()
    chatsCollection.delete(chat.id)
    toast.success(chatTitle ? `Chat "${chatTitle}" deleted` : 'Chat deleted')
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
            {chat?.title ? (
              <span data-mask className="font-semibold">
                {' '}
                "{chat.title}"
              </span>
            ) : (
              ' this chat'
            )}{' '}
            and all its messages.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
          <AlertDialogCancel variant="destructive" onClick={remove}>
            Delete
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
