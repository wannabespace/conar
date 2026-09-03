import { CodeBlock } from '@tamery/ui/components/custom/code-block'
import { cn } from '@tamery/ui/lib/utils'
import type * as React from 'react'
import { Streamdown } from 'streamdown'
import type { ExtraProps } from 'streamdown'

const Code = ({
  children,
  className,
  node: _node,
  ...props
}: React.ComponentProps<'code'> & ExtraProps) =>
  'data-block' in props ? (
    <CodeBlock
      code={String(children).replace(/\n$/u, '')}
      language={
        /language-(?<language>\S+)/u.exec(className ?? '')?.groups?.language ??
        'text'
      }
    />
  ) : (
    <code
      className={cn(
        'bg-foreground/5 rounded-md px-1 py-px font-mono text-[0.9em]',
        className
      )}
      data-mask
      {...props}
    >
      {children}
    </code>
  )

const components = { code: Code }

const prose = `[&_p]:my-2 [&_:is(ul,ol)]:my-2 [&_:is(ul,ol)]:ml-4 [&_:is(ul,ol)]:list-outside [&_li]:my-1 [&_li]:py-0 [&_li_:is(ul,ol)]:mt-1 [&_li_:is(ul,ol)]:pl-0 [&_:is(h1,h2,h3,h4,h5,h6)]:mt-3 [&_:is(h1,h2,h3,h4,h5,h6)]:mb-1 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold [&_:is(h3,h4,h5,h6)]:text-sm [&_:is(h3,h4,h5,h6)]:font-medium [&_a]:underline-offset-2 [&_blockquote]:border-border [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&>:first-child]:mt-0 [&>:last-child]:mb-0`

export const Response = ({
  className,
  ...props
}: React.ComponentProps<typeof Streamdown>) => (
  <Streamdown
    className={cn('min-w-0 text-sm/normal', prose, className)}
    components={components}
    controls={false}
    data-slot="response"
    linkSafety={{ enabled: false }}
    {...props}
  />
)
