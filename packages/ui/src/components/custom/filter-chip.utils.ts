import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export const chipSegmentVariants = cva(
  'flex items-center gap-1 px-1.5 text-xs whitespace-nowrap',
  {
    variants: {
      part: {
        column: 'font-medium',
        icon: 'text-muted-foreground px-1',
        operator: 'text-muted-foreground',
        value: 'max-w-40 font-mono',
      },
    },
  }
)

export type ChipSegmentPart = NonNullable<
  VariantProps<typeof chipSegmentVariants>['part']
>
