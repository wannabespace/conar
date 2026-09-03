import { RiArrowDownSLine } from '@remixicon/react'
import type { HighlightOptions } from '@streamdown/code'
import { code as highlighter } from '@streamdown/code'
import { cn } from '@tamery/ui/lib/utils'
import type { ComponentProps, CSSProperties } from 'react'
import { useState, useSyncExternalStore } from 'react'

import { CopyButton } from './copy-button'

interface Token {
  content: string
  htmlStyle?: CSSProperties
}

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

const useTokens = (code: string, language: string) =>
  useSyncExternalStore(
    (onChange) => {
      let subscribed = true
      highlighter.highlight(
        {
          code,
          language: language as HighlightOptions['language'],
          themes: highlighter.getThemes(),
        },
        () => subscribed && onChange()
      )
      return () => {
        subscribed = false
      }
    },
    () =>
      highlighter.highlight({
        code,
        language: language as HighlightOptions['language'],
        themes: highlighter.getThemes(),
      })?.tokens
  )

const TokenSpans = ({ tokens }: { tokens: Token[] }) =>
  tokens.map((token, index) => (
    <span key={index} style={token.htmlStyle}>
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
  className,
  code,
  collapsible = true,
  header = true,
  language,
  lineNumbers = false,
  ...props
}: ComponentProps<'div'> & {
  code: string
  collapsible?: boolean
  header?: boolean
  language: string
  lineNumbers?: boolean
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
        <code data-mask className={cn(lineNumbers && '[counter-reset:line]')}>
          {(collapsed ? lines.slice(0, COLLAPSED_LINES) : lines).map(
            (line, index) => (
              <span
                className={cn(
                  'block',
                  lineNumbers &&
                    'before:text-muted-foreground/40 before:mr-3 before:inline-block before:w-6 before:text-right before:tabular-nums before:content-[counter(line)] before:[counter-increment:line]'
                )}
                key={index}
              >
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
