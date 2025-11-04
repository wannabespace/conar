import type { ContextSelector } from '@fluentui/react-context-selector'
import type { ComponentProps, ReactElement, ReactNode } from 'react'
import { SingleAccordion, SingleAccordionContent, SingleAccordionTrigger } from '@conar/ui/components/custom/single-accordion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@conar/ui/components/table'
import { cn } from '@conar/ui/lib/utils'
import { createContext, useContextSelector } from '@fluentui/react-context-selector'
import NumberFlow from '@number-flow/react'
import { RiCodeLine, RiText } from '@remixicon/react'
import { marked } from 'marked'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Monaco } from './monaco'

const langsMap = {
  text: 'Text',
  json: 'JSON',
  yaml: 'YAML',
  toml: 'TOML',
  bash: 'Bash',
  javascript: 'JavaScript',
  js: 'JavaScript',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  jsx: 'JSX',
  tsx: 'TSX',
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  sql: 'SQL',
}

interface MarkdownContextType {
  generating?: boolean
  codeActions?: (props: { content: string, lang: string }) => ReactNode
}

const MarkdownContext = createContext<MarkdownContextType>(null!)

function useMarkdownContext<T>(selector: ContextSelector<MarkdownContextType, T>) {
  return useContextSelector(MarkdownContext, selector)
}

const monacoOptions = {
  readOnly: true,
  lineNumbers: 'off' as const,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  folding: false,
}

function Pre({ children }: { children?: ReactNode }) {
  const codeActions = useMarkdownContext(c => c.codeActions)
  const generating = useMarkdownContext(c => c.generating)
  const childrenProps = (typeof children === 'object' && (children as ReactElement<{ children?: ReactNode, className?: string }>)?.props) || null
  const content = childrenProps?.children?.toString().trim() || null
  const lang = (childrenProps?.className?.split('-')[1] || 'text') as keyof typeof langsMap
  const [opened, setOpened] = useState(false)

  if (!content)
    return null

  const lines = content.split('\n').length

  return (
    <div className={cn(generating && 'animate-in fade-in duration-200', 'typography-disabled relative my-4 first:mt-0 last:mb-0')}>
      <SingleAccordion
        open={opened}
        onOpenChange={setOpened}
      >
        <SingleAccordionTrigger className="py-1.5" asChild>
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                {lang === 'text' ? <RiText className="size-4 text-muted-foreground" /> : <RiCodeLine className="size-4 text-muted-foreground" />}
                <span className="font-medium">
                  {langsMap[lang] || lang}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
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
            style={{ height: `${Math.min(content.split('\n').length * 19, 400)}px` }}
          />
        </SingleAccordionContent>
      </SingleAccordion>
    </div>
  )
}

function MarkdownTable({ children, className, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cn('overflow-x-auto my-4', className)} {...props}>
      <Table className="w-full text-sm">
        {children}
      </Table>
    </div>
  )
}

function P({ children, className }: { children?: ReactNode, className?: string }) {
  const generating = useMarkdownContext(c => c.generating)

  if (typeof children === 'string') {
    return (
      <p className={className}>
        {children.split('').map((char, index) => (
          <span
            // eslint-disable-next-line react/no-array-index-key
            key={index}
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

function MarkdownBase({ content }: { content: string }) {
  const processedContent = content.replace(/\n/g, '  \n')

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        pre: ({ children }) => <Pre children={children} />,
        table: MarkdownTable,
        thead: TableHeader,
        tbody: TableBody,
        tr: TableRow,
        p: P,
        th: TableHead,
        td: TableCell,
      }}
      children={processedContent}
    />
  )
}

function parseMarkdownIntoBlocks(markdown: string) {
  const tokens = marked.lexer(markdown)
  return tokens.map(token => token.raw)
}

export function Markdown({
  content,
  id,
  className,
  codeActions,
  generating,
  ...props
}: {
  content: string
  codeActions?: (props: { content: string, lang: string }) => ReactNode
  generating?: boolean
} & ComponentProps<'div'>) {
  const blocks = parseMarkdownIntoBlocks(content)

  return (
    <MarkdownContext.Provider value={{ generating, codeActions }}>
      <div className={cn('typography', generating && 'animate-in fade-in duration-200', className)} {...props}>
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
