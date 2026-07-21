import {
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiErrorWarningFill,
  RiInformationFill,
  RiLoaderLine,
} from '@remixicon/react'
import { Toaster as Sonner } from 'sonner'

import { useTheme } from '../theme-store'

function Toaster() {
  const theme = useTheme()

  return (
    <Sonner
      theme={theme}
      position="top-center"
      className="group"
      icons={{
        success: <RiCheckboxCircleFill className="size-4 text-success" />,
        info: <RiInformationFill className="size-4 text-muted-foreground" />,
        warning: <RiErrorWarningFill className="size-4 text-warning" />,
        error: <RiCloseCircleFill className="size-4 text-destructive" />,
        loading: <RiLoaderLine className="size-4 animate-spin text-muted-foreground" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          // Glass floating chrome: translucent surface + blur + hairline border
          toast: `
            flex w-(--width) items-start gap-2.5 rounded-xl bg-background/80
            p-3 shadow-lg ring-1 ring-foreground/4 backdrop-blur-xl
            select-none
          `,
          content: 'flex min-w-0 flex-1 flex-col gap-0.5',
          icon: 'mt-0.5 flex size-4 shrink-0 items-center justify-center',
          title: 'text-sm leading-tight font-medium text-foreground',
          description: 'text-xs leading-snug text-muted-foreground',
          actionButton: `
            mt-0.5 h-6 shrink-0 self-center rounded-md bg-primary px-2 text-xs
            font-medium whitespace-nowrap text-primary-foreground
            hover:bg-primary/90
          `,
          cancelButton: `
            mt-0.5 h-6 shrink-0 self-center rounded-md bg-input px-2 text-xs
            font-medium whitespace-nowrap text-foreground
            hover:bg-accent
          `,
          closeButton: `
            absolute -top-1.5 -left-1.5 flex size-5 items-center justify-center
            rounded-full bg-popover text-muted-foreground shadow-xs ring-1
            ring-foreground/4
            hover:text-foreground
          `,
        },
      }}
    />
  )
}

export { Toaster }
