import type { ContextSelector } from '@fluentui/react-context-selector'
import {
  createContext,
  useContextSelector,
} from '@fluentui/react-context-selector'
import NumberFlow from '@number-flow/react'
import { RiCodeLine, RiText } from '@remixicon/react'
import {
  SingleAccordion,
  SingleAccordionContent,
  SingleAccordionTrigger,
} from '@tamery/ui/components/custom/single-accordion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@tamery/ui/components/table'
import { cn } from '@tamery/ui/lib/utils'
import { marked } from 'marked'
import type { ComponentProps, ReactElement, ReactNode } from 'react'
import { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { Monaco } from './monaco'

const langsMap = {
  bash: 'Bash',
  css: 'CSS',
  html: 'HTML',
  javascript: 'JavaScript',
  js: 'JavaScript',
  json: 'JSON',
  jsx: 'JSX',
  scss: 'SCSS',
  sql: 'SQL',
  text: 'Text',
  toml: 'TOML',
  ts: 'TypeScript',
  tsx: 'TSX',
  typescript: 'TypeScript',
  yaml: 'YAML',
}

interface MarkdownContextType {
  generating?: boolean
  codeActions?: (props: { content: string; lang: string }) => ReactNode
}

const defaultMarkdownContext: MarkdownContextType = {}
const MarkdownContext = createContext<MarkdownContextType>(
  defaultMarkdownContext
)

const useMarkdownContext = <T,>(
  selector: ContextSelector<MarkdownContextType, T>
) => useContextSelector(MarkdownContext, selector)

const A = ({ target: _target, rel: _rel, ...props }: ComponentProps<'a'>) => (
  // oxlint-disable-next-line jsx-a11y/anchor-has-content
  <a {...props} target="_blank" rel="noopener noreferrer" />
)

const monacoOptions = {
  folding: false,
  lineNumbers: 'off' as const,
  minimap: { enabled: false },
  readOnly: true,
  scrollBeyondLastLine: false,
}

const Pre = ({ children }: { children?: ReactNode }) => {
  const codeActions = useMarkdownContext((c) => c.codeActions)
  const generating = useMarkdownContext((c) => c.generating)
  const childrenProps =
    (typeof children === 'object' &&
      (children as ReactElement<{ children?: ReactNode; className?: string }>)
        ?.props) ||
    null
  const content = childrenProps?.children?.toString().trim() || null
  const lang = (childrenProps?.className?.split('-')[1] ||
    'text') as keyof typeof langsMap
  const [opened, setOpened] = useState(false)

  if (!content) {
    return null
  }

  const lines = content.split('\n').length

  return (
    <div
      className={cn(
        generating && 'animate-in fade-in duration-200',
        'typography-disabled relative my-4 first:mt-0 last:mb-0'
      )}
    >
      <SingleAccordion open={opened} onOpenChange={setOpened}>
        <SingleAccordionTrigger className="py-1.5" asChild>
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                {lang === 'text' ? (
                  <RiText className="text-muted-foreground size-4" />
                ) : (
                  <RiCodeLine className="text-muted-foreground size-4" />
                )}
                <span className="font-medium">{langsMap[lang] || lang}</span>
              </div>
              <span className="text-muted-foreground text-xs">
                <NumberFlow
                  className="tabular-nums"
                  value={lines}
                  suffix={lines === 1 ? ' line' : ' lines'}
                />
              </span>
            </div>
            {codeActions?.({ content, lang })}
          </div>
        </SingleAccordionTrigger>
        <SingleAccordionContent className="p-0">
          <Monaco
            data-mask
            value={content}
            language={lang}
            options={monacoOptions}
            style={{
              height: `${Math.min(content.split('\n').length * 19, 400)}px`,
            }}
          />
        </SingleAccordionContent>
      </SingleAccordion>
    </div>
  )
}

const MarkdownTable = ({
  children,
  className,
  ...props
}: ComponentProps<'div'>) => (
  <div className={cn('my-4 overflow-x-auto', className)} {...props}>
    <Table className="w-full text-sm">{children}</Table>
  </div>
)

const P = ({
  children,
  className,
}: {
  children?: ReactNode
  className?: string
}) => {
  const generating = useMarkdownContext((c) => c.generating)

  if (typeof children === 'string') {
    const chars = [...children].map((char, i) => ({
      char,
      key: `${char}-${i}`,
    }))
    return (
      <p className={className}>
        {chars.map(({ char, key }) => (
          <span
            key={key}
            className={cn(generating && 'animate-in fade-in duration-200')}
          >
            {char}
          </span>
        ))}
      </p>
    )
  }

  return <p className={className}>{children}</p>
}

const MarkdownBase = ({ content }: { content: string }) => {
  const processedContent = content.replaceAll('\n', '  \n')

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: A,
        p: P,
        pre: Pre,
        table: MarkdownTable,
        tbody: TableBody,
        td: TableCell,
        th: TableHead,
        thead: TableHeader,
        tr: TableRow,
      }}
    >
      {processedContent}
    </ReactMarkdown>
  )
}

const parseMarkdownIntoBlocks = (markdown: string) => {
  const tokens = marked.lexer(markdown)
  return tokens.map((token) => token.raw)
}

export const Markdown = ({
  content,
  id,
  className,
  codeActions,
  generating,
  ...props
}: {
  content: string
  codeActions?: (props: { content: string; lang: string }) => ReactNode
  generating?: boolean
} & ComponentProps<'div'>) => {
  const blocks = parseMarkdownIntoBlocks(content)
  const contextValue = useMemo(
    () => ({ codeActions, generating }),
    [generating, codeActions]
  )

  return (
    <MarkdownContext.Provider value={contextValue}>
      <div
        className={cn(
          'typography',
          generating && 'animate-in fade-in duration-200',
          className
        )}
        {...props}
      >
        {blocks.map((block, index) => (
          <MarkdownBase
            key={id ? `${id}-block_${index}` : `block_${index}`}
            content={block}
          />
        ))}
      </div>
    </MarkdownContext.Provider>
  )
}
