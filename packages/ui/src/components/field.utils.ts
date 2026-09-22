import { cva } from 'class-variance-authority'

export const fieldGroupVariants = cva(
  `group/field-group @container/field-group flex w-full flex-col data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4`,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'gap-6',
        sm: 'gap-4',
      },
    },
  }
)

export const fieldVariants = cva(`group/field flex w-full`, {
  defaultVariants: {
    orientation: 'vertical',
  },
  variants: {
    orientation: {
      horizontal: `flex-row items-center gap-3 has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px`,
      responsive: `flex-col gap-1.5 *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:gap-3 @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px`,
      vertical: `flex-col gap-1.5 *:w-full [&>.sr-only]:w-auto`,
    },
  },
})

export const fieldDescriptionVariants = cva(
  `text-muted-foreground [&>a:hover]:text-primary text-left font-normal group-has-data-[orientation=horizontal]/field:text-balance last:mt-0 nth-last-2:-mt-1 [&>a]:underline [&>a]:underline-offset-4 [[data-variant=legend]+&]:-mt-1.5`,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'text-sm/normal',
        sm: 'text-xs/normal',
      },
    },
  }
)
