import type { ComponentProps } from 'react'
import { cn } from '@conar/ui/lib/utils'
import { code } from '@streamdown/code'
import { Streamdown } from 'streamdown'

type StreamdownProps = ComponentProps<typeof Streamdown>

export type MarkdownContentProps = Omit<StreamdownProps, 'components' | 'plugins'> & {
  components?: StreamdownProps['components']
  plugins?: StreamdownProps['plugins']
  trustedContent?: boolean
  isAnimating?: boolean
}

const linkSafetyDefault = { enabled: true } as const
const linkSafetyTrusted = { enabled: false } as const

export function MarkdownContent({
  className,
  components,
  linkSafety,
  trustedContent = false,
  mode = 'static',
  isAnimating,
  plugins,
  ...rest
}: MarkdownContentProps) {
  const resolvedLinkSafety = trustedContent
    ? linkSafetyTrusted
    : linkSafety ?? linkSafetyDefault

  return (
    <Streamdown
      mode={mode}
      className={cn('markdown-content', className)}
      linkSafety={resolvedLinkSafety}
      components={components}
      plugins={{ code, ...(plugins ?? {}) }}
      isAnimating={isAnimating}
      {...rest}
    />
  )
}
