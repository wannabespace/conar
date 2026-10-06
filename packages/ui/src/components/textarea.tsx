import { cn } from '@tamery/ui/lib/utils'
import type { VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { textareaVariants } from './textarea.utils'

const Textarea = ({
  className,
  variant,
  ...props
}: React.ComponentProps<'textarea'> &
  VariantProps<typeof textareaVariants>) => (
  <textarea
    data-slot="textarea"
    className={cn(textareaVariants({ variant }), className)}
    {...props}
  />
)

export { Textarea }
