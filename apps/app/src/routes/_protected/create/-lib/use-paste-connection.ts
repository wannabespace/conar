import type { ConnectionGuess } from '@tamery/connection/guess'
import { guessConnection } from '@tamery/connection/guess'
import { useLocation } from '@tanstack/react-router'
import { useEffect, useEffectEvent, useState } from 'react'

export type PasteVia = 'clipboard' | 'drop' | 'link' | 'paste'

const MAX_DROP_BYTES = 256 * 1024

export const usePasteConnection = ({
  onMiss,
  onPaste,
}: {
  onMiss: () => void
  onPaste: (guess: ConnectionGuess, via: PasteVia) => void
}) => {
  const [dragging, setDragging] = useState(false)
  const connectionLink = useLocation({
    select: (location) => location.state.connectionLink,
  })

  const onRead = useEffectEvent((text: string, via: PasteVia) => {
    const guess = guessConnection(text)
    if (guess) {
      onPaste(guess, via)
    } else {
      onMiss()
    }
  })

  const onPasteEvent = useEffectEvent((event: ClipboardEvent) => {
    const text = event.clipboardData?.getData('text') ?? ''
    const { target } = event
    // Passwords and private keys can look like anything, so a paste into them is never parsed.
    if (
      !text ||
      target instanceof HTMLTextAreaElement ||
      (target instanceof HTMLInputElement && target.type === 'password')
    ) {
      return
    }
    if (
      !(target instanceof HTMLInputElement) &&
      !(target instanceof HTMLElement && target.isContentEditable)
    ) {
      event.preventDefault()
      onRead(text, 'paste')
      return
    }
    // Inside a field only a whole connection parses, so a bare host or a name still pastes as text.
    const guess = guessConnection(text)
    if (
      guess &&
      guess.format !== 'host' &&
      (guess.parts.host || guess.parts.ssh)
    ) {
      event.preventDefault()
      onPaste(guess, 'paste')
    }
  })

  useEffect(() => {
    if (connectionLink) {
      onRead(connectionLink, 'link')
    }
  }, [connectionLink])

  useEffect(() => {
    const onDragOver = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes('Files')) {
        event.preventDefault()
        setDragging(true)
      }
    }
    const onDragLeave = (event: DragEvent) => {
      if (!event.relatedTarget) {
        setDragging(false)
      }
    }
    const onDrop = async (event: DragEvent) => {
      const file = event.dataTransfer?.files[0]
      setDragging(false)
      if (!file) {
        return
      }
      event.preventDefault()
      onRead(file.size > MAX_DROP_BYTES ? '' : await file.text(), 'drop')
    }

    const controller = new AbortController()
    const { signal } = controller
    document.addEventListener('paste', onPasteEvent, { signal })
    document.addEventListener('dragover', onDragOver, { signal })
    document.addEventListener('dragleave', onDragLeave, { signal })
    document.addEventListener('drop', onDrop, { signal })
    return () => controller.abort()
  }, [])

  return { dragging }
}
