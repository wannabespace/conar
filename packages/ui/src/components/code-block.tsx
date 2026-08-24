import { RiArrowDownSLine } from '@remixicon/react'
import { createCodePlugin } from '@streamdown/code'
import { CopyButton } from '@tamery/ui/components/custom/copy-button'
import { cn } from '@tamery/ui/lib/utils'
import * as React from 'react'

interface Token {
  content: string
  htmlStyle?: React.CSSProperties
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

// Shiki loads a grammar the first time it sees a language, and both paths are
// needed: a warm call returns tokens synchronously and never invokes the
// callback, a cold call returns null and answers later. The result lives in
// state so React Compiler cannot memoize a stale `undefined` across the load.
const options = (code: string, language: string) => ({
  code,
  language: language as never,
  themes: highlighter.getThemes(),
})

// Shiki loading can fail (grammar fetch, unsupported build); plain code is a
// fine outcome, a blank block is not.
const guard = <T,>(read: () => T): T | undefined => {
  try {
    return read()
  } catch (error) {
    // oxlint-disable-next-line no-console -- a highlighter that silently stops is worse
    console.warn('[tamery/ui] code highlighting unavailable', error)
    return undefined
  }
}

const readTokens = (code: string, language: string) =>
  highlighter.supportsLanguage(language as never)
    ? guard(
        () =>
          highlighter.highlight(options(code, language))?.tokens as
            | Token[][]
            | undefined
      )
    : undefined

const useTokens = (code: string, language: string) => {
  const key = `${language}:${code}`
  const [cache, setCache] = React.useState(() => ({
    key,
    tokens: readTokens(code, language),
  }))

  if (cache.key !== key) {
    setCache({ key, tokens: readTokens(code, language) })
  }

  React.useEffect(() => {
    if (cache.tokens || !highlighter.supportsLanguage(language as never)) {
      return
    }

    let active = true

    guard(() =>
      highlighter.highlight(options(code, language), (result) => {
        if (active) {
          setCache({ key, tokens: result.tokens as Token[][] })
        }
      })
    )

    return () => {
      active = false
    }
  }, [cache.tokens, code, key, language])

  return cache.key === key ? cache.tokens : undefined
}

const CodeBlock = ({
  actions,
  className,
  code,
  language,
  ...props
}: React.ComponentProps<'div'> & {
  actions?: React.ReactNode
  code: string
  language: string
}) => {
  const [expanded, setExpanded] = React.useState(false)
  const highlighted = useTokens(code, language)

  // Unhighlighted code becomes one token per line, so there is a single way to
  // render, slice and count lines.
  const lines: Token[][] =
    highlighted ?? code.split('\n').map((line) => [{ content: line }])
  const hidden = lines.length - COLLAPSED_LINES
  const collapsed = hidden > 0 && !expanded

  return (
    <div
      className={cn(
        'bg-foreground/3 my-2 min-w-0 overflow-hidden rounded-lg',
        className
      )}
      data-slot="code-block"
      {...props}
    >
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
      <pre
        className={cn(
          'text-2xs/5 scrollbar-thin overflow-auto px-2 font-mono',
          collapsed ? 'pb-0' : 'max-h-72 pb-2'
        )}
      >
        <code data-mask>
          {(collapsed ? lines.slice(0, COLLAPSED_LINES) : lines).map(
            (line, index) => (
              <span className="block" key={`line-${index}`}>
                {line.map((token, tokenIndex) => (
                  <span key={`token-${tokenIndex}`} style={token.htmlStyle}>
                    {token.content}
                  </span>
                ))}
                {'\n'}
              </span>
            )
          )}
        </code>
      </pre>
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

export { CodeBlock }
