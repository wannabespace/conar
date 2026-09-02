import { RiArrowDownSLine } from '@remixicon/react'
import type { HighlightResult } from '@streamdown/code'
import { createCodePlugin } from '@streamdown/code'
import { cn } from '@tamery/ui/lib/utils'
import type { ComponentProps, CSSProperties, ReactNode } from 'react'
import { useState, useSyncExternalStore } from 'react'

import { CopyButton } from './copy-button'

interface Token {
  content: string
  htmlStyle?: CSSProperties
}

const COLLAPSED_LINES = 10

const highlighter = createCodePlugin({
  themes: ['github-light', 'github-dark'],
})

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

const highlight = (
  code: string,
  language: string,
  onResult?: (result: HighlightResult) => void
) =>
  highlighter.highlight(
    { code, language: language as never, themes: highlighter.getThemes() },
    onResult
  )

const useTokens = (code: string, language: string) =>
  useSyncExternalStore(
    (onChange) => {
      let subscribed = true
      highlight(code, language, () => subscribed && onChange())
      return () => {
        subscribed = false
      }
    },
    () => highlight(code, language)?.tokens as Token[][] | undefined
  )

const TokenSpans = ({ tokens }: { tokens: Token[] }) =>
  tokens.map((token, index) => (
    <span key={`token-${index}`} style={token.htmlStyle}>
      {token.content}
    </span>
  ))

const CodeInline = ({
  className,
  code,
  language,
  ...props
}: ComponentProps<'code'> & {
  code: string
  language: string
}) => {
  const tokens = useTokens(code, language)

  return (
    <code
      data-slot="code-block"
      className={cn('font-mono', className)}
      {...props}
    >
      {tokens ? <TokenSpans tokens={tokens.flat()} /> : code}
    </code>
  )
}

const CodeBlock = ({
  actions,
  className,
  code,
  collapsible = true,
  header = true,
  language,
  ...props
}: ComponentProps<'div'> & {
  actions?: ReactNode
  code: string
  collapsible?: boolean
  header?: boolean
  language: string
}) => {
  const [expanded, setExpanded] = useState(false)
  const lines: Token[][] =
    useTokens(code, language) ??
    code.split('\n').map((line) => [{ content: line }])
  const hidden = lines.length - COLLAPSED_LINES
  const collapsed = collapsible && hidden > 0 && !expanded

  return (
    <div
      className={cn(
        'bg-foreground/3 my-2 min-w-0 overflow-hidden rounded-lg',
        className
      )}
      data-slot="code-block"
      {...props}
    >
      {header && (
        <div className="text-muted-foreground text-2xs flex h-6 items-center gap-0.5 pr-0.5 pl-2">
          <span className="min-w-0 flex-1 truncate">
            {LANGUAGE_LABELS[language] ?? language}
          </span>
          {actions}
          <CopyButton
            className="text-muted-foreground size-5 [&_svg]:size-3"
            size="icon-sm"
            text={code}
            variant="ghost"
          />
        </div>
      )}
      <pre
        className={cn(
          'text-2xs/5 scrollbar-thin overflow-auto px-2 font-mono',
          collapsed ? 'pb-0' : 'pb-2',
          collapsible && !collapsed && 'max-h-72'
        )}
      >
        <code data-mask>
          {(collapsed ? lines.slice(0, COLLAPSED_LINES) : lines).map(
            (line, index) => (
              <span className="block" key={`line-${index}`}>
                <TokenSpans tokens={line} />
                {'\n'}
              </span>
            )
          )}
        </code>
      </pre>
      {collapsible && hidden > 0 && (
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

export { CodeBlock, CodeInline }
