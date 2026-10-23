import { ResponseCodeBlock } from '@tamery/ui/components/response'
import { cn } from '@tamery/ui/lib/utils'
import type { ComponentProps, ReactElement, ReactNode } from 'react'
import { isValidElement } from 'react'

const headingText = (children: ReactNode): string => {
  if (typeof children === 'string') {
    return children
  }
  if (Array.isArray(children)) {
    return children.map(headingText).join('')
  }
  if (isValidElement<{ children?: ReactNode }>(children)) {
    return headingText(children.props.children)
  }
  return ''
}

const slug = (children: ReactNode) =>
  headingText(children)
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, '-')
    .replaceAll(/^-|-$/gu, '')

export const mdxComponents = {
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
  code: ({ className, ...props }: ComponentProps<'code'>) => (
    <code
      className={cn(
        'bg-foreground/5 rounded-md px-1 py-px font-mono text-sm',
        className
      )}
      data-mask
      {...props}
    />
  ),
  h2: ({ children, ...props }: ComponentProps<'h2'>) => (
    <h2 className="scroll-mt-24" id={slug(children)} {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: ComponentProps<'h3'>) => (
    <h3 className="scroll-mt-24" id={slug(children)} {...props}>
      {children}
    </h3>
  ),
  pre: ({ children }: ComponentProps<'pre'>) => {
    const code = children as ReactElement<{
      children?: string
      className?: string
    }>
    const language =
      /language-(?<language>\S+)/u.exec(code.props.className ?? '')?.groups
        ?.language ?? 'text'
    return (
      <ResponseCodeBlock
        code={String(code.props.children ?? '').replace(/\n$/u, '')}
        language={language}
      />
    )
  },
  table: (props: ComponentProps<'table'>) => (
    <div className="my-6 overflow-x-auto">
      <table
        className="w-full border-collapse text-left text-sm [&_td:first-child]:whitespace-nowrap [&_th:first-child]:whitespace-nowrap"
        {...props}
      />
    </div>
  ),
  th: ({ className, ...props }: ComponentProps<'th'>) => (
    <th
      className={cn(
        'text-muted-foreground border-border border-b px-4 py-2.5 font-medium',
        className
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }: ComponentProps<'td'>) => (
    <td
      className={cn(
        'border-border/50 border-b px-4 py-2.5 align-top',
        className
      )}
      {...props}
    />
  ),
}
