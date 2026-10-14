import type { ConnectionGuess } from '@tamery/connection/guess'
import { guessConnection } from '@tamery/connection/guess'
import { tryCatchAsync } from '@tamery/shared/utils'
import { isMac } from '@tamery/ui/lib/os'
import { useLocation } from '@tanstack/react-router'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { toast } from 'sonner'

import { posthog } from '~/lib/posthog'

export type PasteVia = 'clipboard' | 'drop' | 'link' | 'paste'

export interface PasteFlash {
  count: number
  result: 'hit' | 'miss'
  shown: boolean
}

export const PASTE_FORMATS =
  'Connection URLs, .env files, JDBC strings, and psql, mysql or ssh commands.'

const MAX_DROP_BYTES = 256 * 1024
const CONNECTION_FIELD = 'host'
const FLASH_SHOWN_MS = 3000

export const usePasteConnection = ({
  onPaste,
  pitchShown,
}: {
  onPaste: (guess: ConnectionGuess, via: PasteVia) => void
  pitchShown: boolean
}) => {
  const [dragging, setDragging] = useState(false)
  const [flash, setFlash] = useState<PasteFlash>({
    count: 0,
    result: 'hit',
    shown: false,
  })
  const hideFlash = useRef(0)
  const connectionLink = useLocation({
    select: (location) => location.state.connectionLink,
  })

  const showFlash = (result: PasteFlash['result']) => {
    setFlash(({ count }) => ({ count: count + 1, result, shown: true }))
    window.clearTimeout(hideFlash.current)
    hideFlash.current = window.setTimeout(
      () => setFlash((current) => ({ ...current, shown: false })),
      FLASH_SHOWN_MS
    )
  }

  const hit = (guess: ConnectionGuess, via: PasteVia) => {
    onPaste(guess, via)
    showFlash('hit')
  }

  const read = (text: string, via: PasteVia) => {
    const guess = guessConnection(text)
    if (guess) {
      hit(guess, via)
      return
    }
    posthog.capture('connection_paste_missed', { via })
    if (!pitchShown) {
      toast('No connection found', { description: PASTE_FORMATS })
      return
    }
    showFlash('miss')
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
    const field =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      (target instanceof HTMLElement && target.isContentEditable)
        ? target
        : null
    // Only Host reads a pasted connection; any other field keeps the text, so a string can be trimmed down to the part it needs (a password, a database).
    if (!text || (field && field.id !== CONNECTION_FIELD)) {
      return
    }
    if (!field) {
      event.preventDefault()
      read(text, 'paste')
      return
    }
    // In Host only a whole connection parses, so a bare host still pastes as text.
    const guess = guessConnection(text)
    if (
      guess &&
      guess.format !== 'host' &&
      (guess.parts.host || guess.parts.ssh)
    ) {
      event.preventDefault()
      hit(guess, 'paste')
    }
  })

  useEffect(() => {
    if (connectionLink) {
      // oxlint-disable-next-line react/set-state-in-effect -- the link arrives in navigation state, so this effect is where it is read; its result shows like a paste's.
      onRead(connectionLink, 'link')
    }
  }, [connectionLink])

  useEffect(() => {
    const onDragOver = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes('Files')) {
        setDragging(true)
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

  return { dragging, flash, readClipboard }
}
