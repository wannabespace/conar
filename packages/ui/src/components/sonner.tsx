import { RiAlertLine, RiCheckLine, RiErrorWarningLine, RiInformationLine, RiLoader4Line } from '@remixicon/react'
import { createPortal } from 'react-dom'
import { Toaster as Sonner } from 'sonner'
import { useIsMounted } from '../hookas/use-is-mounted'
import { useTheme } from '../theme-store'

export function Toaster() {
  const theme = useTheme()
  const isMounted = useIsMounted()

  if (!isMounted) {
    return null
  }

  return createPortal(
    <Sonner
      theme={theme}
      className="toaster group"
      position="bottom-center"
      closeButton
      toastOptions={{
        classNames: {
          toast: 'cn-toast',
        },
        style: {
          '--z-index': '100',
          'zIndex': 'calc(var(--z-index) - var(--index))',
        },
      }}
      icons={{
        success: (
          <RiCheckLine className="size-4 text-success" />
        ),
        info: (
          <RiInformationLine className="size-4 text-info" />
        ),
        warning: (
          <RiAlertLine className="size-4 text-warning" />
        ),
        error: (
          <RiErrorWarningLine className="size-4 text-destructive" />
        ),
        loading: (
          <RiLoader4Line className="size-4 animate-spin" />
        ),
      }}
      style={{
        '--normal-bg': 'var(--popover)',
        '--normal-text': 'var(--popover-foreground)',
        '--normal-border': 'var(--border)',
        '--border-radius': 'var(--radius)',
      }}
    />,
    document.body,
  )
}
