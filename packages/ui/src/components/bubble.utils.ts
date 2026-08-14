import { cva } from 'class-variance-authority'

export const bubbleVariants = cva(
  `group/bubble relative flex w-fit max-w-[80%] min-w-0 flex-col gap-1 group-data-[align=end]/message:self-end data-[align=end]:self-end data-[variant=ghost]:max-w-full`,
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        default: `*:data-[slot=bubble-content]:bg-primary *:data-[slot=bubble-content]:text-primary-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:bg-primary/80`,
        destructive: `*:data-[slot=bubble-content]:bg-destructive/15 *:data-[slot=bubble-content]:text-destructive [&>[data-slot=bubble-content]:is(button,a):hover]:bg-destructive/25`,
        ghost: `[&>[data-slot=bubble-content]:is(button,a):hover]:bg-foreground/5 [&>[data-slot=bubble-content]:is(button,a):hover]:text-foreground border-none *:data-[slot=bubble-content]:rounded-none *:data-[slot=bubble-content]:bg-transparent *:data-[slot=bubble-content]:p-0`,
        muted: `*:data-[slot=bubble-content]:bg-muted [&>[data-slot=bubble-content]:is(button,a):hover]:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_5%)]`,
        outline: `*:data-[slot=bubble-content]:border-border *:data-[slot=bubble-content]:bg-background [&>[data-slot=bubble-content]:is(button,a):hover]:bg-foreground/5 [&>[data-slot=bubble-content]:is(button,a):hover]:text-foreground`,
        secondary: `*:data-[slot=bubble-content]:bg-secondary *:data-[slot=bubble-content]:text-secondary-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]`,
        tinted: `*:data-[slot=bubble-content]:text-foreground *:data-[slot=bubble-content]:bg-[color-mix(in_oklch,var(--primary)_18%,var(--background))] [&>[data-slot=bubble-content]:is(button,a):hover]:bg-[color-mix(in_oklch,var(--primary)_26%,var(--background))]`,
      },
    },
  }
)

export const bubbleReactionsVariants = cva(
  `bg-muted ring-card absolute z-10 flex w-fit shrink-0 items-center justify-center gap-1 rounded-full px-1.5 py-0.5 text-sm ring-3 has-[button]:p-0`,
  {
    defaultVariants: {
      align: 'end',
      side: 'bottom',
    },
    variants: {
      align: {
        end: 'right-3',
        start: 'left-3',
      },
      side: {
        bottom: 'bottom-0 translate-y-3/4',
        top: 'top-0 -translate-y-3/4',
      },
    },
  }
)
