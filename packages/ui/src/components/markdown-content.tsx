import type { ComponentProps } from 'react'
import { cn } from '@conar/ui/lib/utils'
import { code } from '@streamdown/code'
import { Streamdown } from 'streamdown'

export function MarkdownContent({
  className,
  components,
  plugins,
  trustedContent,
  linkSafety,
  mode = 'static',
  ...rest
}: ComponentProps<typeof Streamdown> & { trustedContent?: boolean }) {
  return (
    <Streamdown
      {...rest}
      mode={mode}
      className={cn('markdown-content', className)}
      components={components}
      linkSafety={trustedContent ? { enabled: false } : linkSafety ?? { enabled: true }}
      plugins={{ code, ...(plugins ?? {}) }}
    />
  )
}
