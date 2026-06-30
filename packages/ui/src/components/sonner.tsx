import { RiCheckboxCircleLine, RiCloseCircleLine, RiErrorWarningLine, RiInformationLine, RiLoaderLine } from '@remixicon/react'
import { createPortal } from 'react-dom'
import { Toaster as Sonner } from 'sonner'
import { useIsMounted } from '../hookas/use-is-mounted'
import { useTheme } from '../theme-store'

function Toaster() {
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
          <RiCheckboxCircleLine className="size-4" />
        ),
        info: (
          <RiInformationLine className="size-4" />
        ),
        warning: (
          <RiErrorWarningLine className="size-4" />
        ),
        error: (
          <RiCloseCircleLine className="size-4" />
        ),
        loading: (
          <RiLoaderLine className="size-4 animate-spin" />
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

export { Toaster }
