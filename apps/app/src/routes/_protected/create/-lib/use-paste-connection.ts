import type { ConnectionGuess } from '@tamery/connection/guess'
import { guessConnection } from '@tamery/connection/guess'
import { tryCatchAsync } from '@tamery/shared/utils'
import { useLocation } from '@tanstack/react-router'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { toast } from 'sonner'

import { posthog } from '~/lib/posthog'

import type { Miss } from '../-components/paste-hero'
import { isMac, PASTE_FORMATS } from '../-components/paste-hero'

export type PasteVia = 'clipboard' | 'drop' | 'link' | 'paste'

const MAX_DROP_BYTES = 256 * 1024
const MISS_SHOWN_MS = 3000

export const usePasteConnection = ({
  onPaste,
  pitchShown,
}: {
  onPaste: (guess: ConnectionGuess, via: PasteVia) => void
  pitchShown: boolean
}) => {
  const [dragging, setDragging] = useState(false)
  const [miss, setMiss] = useState<Miss>({ count: 0, shown: false })
  const hideMiss = useRef(0)
  const connectionLink = useLocation({
    select: (location) => location.state.connectionLink,
  })

  const showMiss = (via: PasteVia) => {
    posthog.capture('connection_paste_missed', { via })
    if (!pitchShown) {
      toast('No connection found', { description: PASTE_FORMATS })
      return
    }
    setMiss(({ count }) => ({ count: count + 1, shown: true }))
    window.clearTimeout(hideMiss.current)
    hideMiss.current = window.setTimeout(
      () => setMiss((current) => ({ ...current, shown: false })),
      MISS_SHOWN_MS
    )
  }

  const read = (text: string, via: PasteVia) => {
    const guess = guessConnection(text)
    if (guess) {
      onPaste(guess, via)
    } else {
      showMiss(via)
    }
  }
  const onRead = useEffectEvent(read)

  const readClipboard = async () => {
    const { data: text } = await tryCatchAsync(() =>
      navigator.clipboard.readText()
    )
    if (text === null) {
      toast(
        `Couldn't read the clipboard. Press ${isMac ? '⌘V' : 'Ctrl+V'} instead.`
      )
      return
    }
    read(text, 'clipboard')
  }

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
      // oxlint-disable-next-line react/set-state-in-effect -- the link arrives in navigation state, so this effect is where it is read; a miss shows like a paste's.
      onRead(connectionLink, 'link')
    }
  }, [connectionLink])

  useEffect(() => {
    const onDragOver = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes('Files')) {
        // A field that takes the file (the private key) prevents the event first, so the overlay steps aside for it.
        setDragging(!event.defaultPrevented)
        event.preventDefault()
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
      if (!file || event.defaultPrevented) {
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

  return { dragging, miss, readClipboard }
}
