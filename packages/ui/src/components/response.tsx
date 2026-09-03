import { RiArrowDownSLine } from '@remixicon/react'
import { CodeBlock } from '@tamery/ui/components/custom/code-block'
import { CopyButton } from '@tamery/ui/components/custom/copy-button'
import { cn } from '@tamery/ui/lib/utils'
import type * as React from 'react'
import { useState } from 'react'
import { Streamdown } from 'streamdown'
import type { ExtraProps } from 'streamdown'

const COLLAPSED_LINES = 10

const LANGUAGE_LABELS: Record<string, string> = {
  bash: 'Bash',
  css: 'CSS',
  html: 'HTML',
  js: 'JavaScript',
  json: 'JSON',
  jsx: 'JSX',
  py: 'Python',
  sh: 'Shell',
  sql: 'SQL',
  ts: 'TypeScript',
  tsx: 'TSX',
  yaml: 'YAML',
}

export const ResponseCodeBlock = ({
  className,
  code,
  language,
  ...props
}: React.ComponentProps<'div'> & {
  code: string
  language: string
}) => {
  const [expanded, setExpanded] = useState(false)
  const lines = code.split('\n')
  const hidden = lines.length - COLLAPSED_LINES
  const collapsed = hidden > 0 && !expanded

  return (
    <div
      className={cn(
        'bg-foreground/3 my-2 min-w-0 overflow-hidden rounded-lg',
        className
      )}
      {...props}
    >
      <div className="text-muted-foreground text-2xs flex h-6 items-center gap-0.5 pr-0.5 pl-2">
        <span className="min-w-0 flex-1 truncate">
          {LANGUAGE_LABELS[language] ?? language}
        </span>
        <CopyButton
          className="text-muted-foreground size-5 [&_svg]:size-3"
          size="icon-sm"
          text={code}
          variant="ghost"
        />
      </div>
      <CodeBlock
        className={collapsed ? 'pb-0' : 'max-h-72 pb-2'}
        code={collapsed ? lines.slice(0, COLLAPSED_LINES).join('\n') : code}
        language={language}
      />
      {hidden > 0 && (
        <button
          className="text-muted-foreground hover:bg-foreground/3 hover:text-foreground text-2xs flex h-6 w-full items-center gap-1 px-2 transition-colors"
          onClick={() => setExpanded((current) => !current)}
          type="button"
        >
          <RiArrowDownSLine
            className={cn(
              'size-3 transition-transform',
              expanded && 'rotate-180'
            )}
          />
          {expanded
            ? 'Show less'
            : `Show ${hidden} more ${hidden === 1 ? 'line' : 'lines'}`}
        </button>
      )}
    </div>
  )
}

const Code = ({
  children,
  className,
  node: _node,
  ...props
}: React.ComponentProps<'code'> & ExtraProps) =>
  'data-block' in props ? (
    <ResponseCodeBlock
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
