import { cva } from 'class-variance-authority'

export const popoverContentVariants = cva(
  `bg-background text-foreground ring-foreground/4 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 z-50 flex w-72 origin-(--transform-origin) flex-col rounded-xl text-sm shadow-xl ring-[0.5px] outline-hidden ease-[cubic-bezier(0.32,0.72,0,1)] data-closed:duration-100 data-open:duration-150`,
  {
    defaultVariants: {
      padding: 'default',
    },
    variants: {
      padding: {
        default: 'gap-4 p-4',
        none: 'gap-0 p-0 **:data-[slot=popover-viewport]:p-0',
        sm: 'gap-2 p-2',
      },
    },
  }
)
