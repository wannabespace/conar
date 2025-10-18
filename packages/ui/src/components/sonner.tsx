import { Toaster as Sonner } from 'sonner'
import { useTheme } from '../theme-observer'

function Toaster() {
  const { resolvedTheme } = useTheme()

  return (
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
        } as React.CSSProperties,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
    />
  )
}

export { Toaster }
