import type { HighlightOptions } from '@streamdown/code'
import { code as highlighter } from '@streamdown/code'
import { cn } from '@tamery/ui/lib/utils'
import type { ComponentProps, CSSProperties } from 'react'
import { useRef, useSyncExternalStore } from 'react'

interface Token {
  content: string
  htmlStyle?: CSSProperties
}

const useTokens = (code: string, language: string) => {
  const cache = useRef<{ key: string; tokens?: Token[][] }>({ key: '' })
  const key = `${language}\n${code}`

  return useSyncExternalStore(
    (onChange) => {
      let subscribed = true

      if (cache.current.key !== key) {
        cache.current = { key }
        const ready = highlighter.highlight(
          {
            code,
            language: language as HighlightOptions['language'],
            themes: highlighter.getThemes(),
          },
          ({ tokens }) => {
            if (cache.current.key === key) {
              cache.current = { key, tokens }
            }
            if (subscribed) {
              onChange()
            }
          }
        )
        if (ready) {
          cache.current = { key, tokens: ready.tokens }
        }
      }

      return () => {
        subscribed = false
      }
    },
    () => (cache.current.key === key ? cache.current.tokens : undefined)
  )
}

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
  language,
  lineNumbers = false,
  ...props
}: ComponentProps<'pre'> & {
  code: string
  language: string
  lineNumbers?: boolean
}) => {
  const lines: Token[][] =
    useTokens(code, language) ??
    code.split('\n').map((line) => [{ content: line }])

  return (
    <pre
      className={cn(
        'text-2xs/5 scrollbar-thin overflow-auto px-2 font-mono',
        className
      )}
      data-slot="code-block"
      {...props}
    >
      <code data-mask className={cn(lineNumbers && '[counter-reset:line]')}>
        {lines.map((line, index) => (
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
        ))}
      </code>
    </pre>
  )
}

export { CodeBlock, CodeInline }
