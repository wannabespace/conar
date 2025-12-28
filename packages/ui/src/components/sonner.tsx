import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Toaster as Sonner } from 'sonner'
import { useTheme } from '../theme-observer'

function Toaster() {
  const { resolvedTheme } = useTheme()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return createPortal(
    <Sonner
      theme={resolvedTheme}
      className="toaster group"
      position="top-center"
      closeButton
      richColors
      toastOptions={{
        style: {
          '--z-index': '100',
          'zIndex': 'calc(var(--z-index) - var(--index))',
        },
      }}
      style={{
        '--normal-bg': 'var(--popover)',
        '--normal-text': 'var(--popover-foreground)',
        '--normal-border': 'var(--border)',
      }}
    />,
    document.body,
  )
}

export { Toaster }
