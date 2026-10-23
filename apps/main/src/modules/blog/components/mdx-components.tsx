import { markdownComponents } from '@tamery/ui/components/custom/markdown'
import type { ComponentProps } from 'react'

export const mdxComponents = {
  ...markdownComponents,
  a: ({ href = '', children, ...props }: ComponentProps<'a'>) =>
    /^https?:/u.test(href) ? (
      <a href={href} rel="noopener noreferrer" target="_blank" {...props}>
        {children}
      </a>
    ) : (
      <a href={href} {...props}>
        {children}
      </a>
    ),
}
