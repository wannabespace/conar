import { ArrowDown01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { CodeBlock } from '@tamery/ui/components/custom/code-block'
import { CopyButton } from '@tamery/ui/components/custom/copy-button'
import { cn } from '@tamery/ui/lib/utils'
import type { VariantProps } from 'class-variance-authority'
import type * as React from 'react'
import { useState } from 'react'
import { Streamdown } from 'streamdown'
import type { ExtraProps } from 'streamdown'

import { responseVariants } from './response.utils'

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
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            strokeWidth={2}
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

export const Response = ({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof Streamdown> &
  VariantProps<typeof responseVariants>) => (
  <Streamdown
    className={cn(responseVariants({ variant }), className)}
    components={components}
    controls={false}
    data-slot="response"
    linkSafety={{ enabled: false }}
    {...props}
  />
)
