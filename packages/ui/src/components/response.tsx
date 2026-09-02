import { CodeBlock } from '@tamery/ui/components/custom/code-block'
import { cn } from '@tamery/ui/lib/utils'
import type * as React from 'react'
import { Streamdown } from 'streamdown'

// Owning `pre` replaces Streamdown's code block outright — its own chrome is
// registry-sized (line-number gutter, boxed copy button) and styles against
// `bg-sidebar`, a token this theme does not define.
const Pre = ({ children }: { children?: React.ReactNode }) => {
  const props = (
    children as React.ReactElement<{
      children?: React.ReactNode
      className?: string
    }>
  )?.props
  const code = props?.children?.toString().replace(/\n$/u, '') ?? ''
  const language =
    /language-(?<language>\S+)/u.exec(props?.className ?? '')?.groups
      ?.language ?? 'text'

  return code ? <CodeBlock code={code} language={language} /> : null
}

const components = { pre: Pre }

const prose = `[&_ol]:my-2 [&_ol]:ml-4 [&_p]:my-2 [&_ul]:my-2 [&_ul]:ml-4 [&_li]:py-0.5 [&_:is(h1,h2,h3)]:mt-3 [&_:is(h1,h2,h3)]:mb-1 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-medium [&_a]:underline-offset-2 [&_blockquote]:border-border [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&>:first-child]:mt-0 [&>:last-child]:mb-0`
const inlineCode = `[&_[data-streamdown=inline-code]]:bg-foreground/5 [&_[data-streamdown=inline-code]]:rounded-md [&_[data-streamdown=inline-code]]:px-1 [&_[data-streamdown=inline-code]]:py-px [&_[data-streamdown=inline-code]]:font-mono [&_[data-streamdown=inline-code]]:text-[0.9em]`

const Response = ({
  className,
  ...props
}: React.ComponentProps<typeof Streamdown>) => (
  <Streamdown
    className={cn('min-w-0 text-sm/normal', prose, inlineCode, className)}
    components={components}
    controls={false}
    data-slot="response"
    linkSafety={{ enabled: false }}
    {...props}
  />
)

export { Response }
