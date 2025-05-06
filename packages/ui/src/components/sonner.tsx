import type { ToasterProps } from 'sonner'
import { useTheme } from 'next-themes'
import { Toaster as Sonner } from 'sonner'

function Toaster() {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      position="top-right"
      richColors
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
