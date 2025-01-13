import { Toaster as Sonner } from 'sonner'
import { cn } from '../lib/utils'
import { useTheme } from '../theme-provider'

type ToasterProps = React.ComponentProps<typeof Sonner>

function Toaster() {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      // eslint-disable-next-line tailwindcss/no-custom-classname
      className="toaster group"
      cn={cn}
      richColors
      toastOptions={{
        classNames: {
          toast:
            'group toast border border-input group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg data-[type=error]:group-[.toaster]:text-destructive',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
    />
  )
}

export { Toaster }
