import type { ContextSelector } from '@fluentui/react-context-selector'
import type { ComponentProps, ReactElement, ReactNode } from 'react'
import { Button } from '@conar/ui/components/button'
import { SingleAccordion, SingleAccordionContent, SingleAccordionTrigger } from '@conar/ui/components/custom/single-accordion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@conar/ui/components/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { useMountedEffect } from '@conar/ui/hookas/use-mounted-effect'
import { copy } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import { createContext, useContextSelector } from '@fluentui/react-context-selector'
import NumberFlow from '@number-flow/react'
import { RiArrowRightDoubleLine, RiFileCopyLine } from '@remixicon/react'
import { marked } from 'marked'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import { trackEvent } from '~/lib/events'
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
  loading: boolean
}

const MarkdownContext = createContext<MarkdownContextType>(null!)

function useMarkdownContext<T>(selector: ContextSelector<MarkdownContextType, T>) {
  return useContextSelector(MarkdownContext, selector)
}

function Pre({ children, onEdit }: { children?: ReactNode, onEdit?: (content: string) => void }) {
  const childrenProps = (typeof children === 'object' && (children as ReactElement<{ children?: ReactNode, className?: string }>)?.props) || null
  const content = childrenProps?.children?.toString().trim() || null
  const lang = (childrenProps?.className?.split('-')[1] || 'text') as keyof typeof langsMap
  const [isPreLoading, setIsPreLoading] = useState(false)
  const loading = useMarkdownContext(state => state.loading)
  const [opened, setOpened] = useState(false)

  useEffect(() => {
    if (!loading) {
      setIsPreLoading(false)
      return
    }

    setIsPreLoading(true)

    const timeout = setTimeout(() => {
      setIsPreLoading(false)
    }, 1000)

    return () => clearTimeout(timeout)
  }, [content, loading])

  useMountedEffect(() => {
    if (!isPreLoading && content && content.split('\n').length < 10) {
      setOpened(true)
    }
  }, [isPreLoading])

  if (!content)
    return null

  const lines = content.split('\n').length

  return (
    <div className="typography-disabled relative my-4 first:mt-0 last:mb-0">
      <SingleAccordion
        open={opened}
        onOpenChange={setOpened}
      >
        <SingleAccordionTrigger className="py-1.5" asChild>
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="font-medium">
                  {langsMap[lang] || lang}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                <NumberFlow className="tabular-nums" value={lines} />
                {' '}
                line
                {lines === 1 ? '' : 's'}
              </span>
              <AnimatePresence>
                {isPreLoading && (
                  <motion.span
                    className="text-xs text-muted-foreground mt-0.5"
                    initial={{ opacity: 0, x: 3 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 3 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="animate-pulse">
                      Generating...
                    </span>
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <div className="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        copy(content, 'Copied to clipboard')
                        trackEvent('markdown_copy_to_clipboard')
                      }}
                    >
                      <RiFileCopyLine className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Copy to clipboard
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {onEdit && lang === 'sql' && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        disabled={isPreLoading}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(content)
                          toast.success('Moved to runner')
                          trackEvent('markdown_move_to_runner')
                        }}
                      >
                        <RiArrowRightDoubleLine className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Move to runner
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </SingleAccordionTrigger>
        <SingleAccordionContent className="p-0">
          <Monaco
            data-mask
            value={content}
            language={lang}
            options={{
              readOnly: true,
              lineNumbers: 'off',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              folding: false,
            }}
            style={{ height: `${Math.min(content.split('\n').length * 19, 400)}px` }}
          />
        </SingleAccordionContent>
      </SingleAccordion>
    </div>
  )
}

function MarkdownTable({ children }: { children?: ReactNode }) {
  return (
    <div className="overflow-x-auto my-4">
      <Table className="w-full text-sm">
        {children}
      </Table>
    </div>
  )
}

function MarkdownTableCell({ isHeader, children }: { isHeader?: boolean, children?: ReactNode }) {
  if (isHeader) {
    return <TableHead>{children}</TableHead>
  }
  return <TableCell>{children}</TableCell>
}

function MarkdownBase({ content, onEdit }: { content: string, onEdit?: (content: string) => void }) {
  const processedContent = content.replace(/\n/g, '  \n')

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        pre: preProps => <Pre {...preProps} onEdit={onEdit} />,
        table: MarkdownTable,
        thead: TableHeader,
        tbody: TableBody,
        tr: TableRow,
        th: props => <MarkdownTableCell isHeader {...props} />,
        td: props => <MarkdownTableCell {...props} />,
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
  onEdit,
  loading = false,
  ...props
}: {
  content: string
  onEdit?: (content: string) => void
  loading?: boolean
} & ComponentProps<'div'>) {
  const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content])

  return (
    <MarkdownContext.Provider value={{ loading }}>
      <div className={cn('typography', className)} {...props}>
        {blocks.map((block, index) => (
          <MarkdownBase
            content={block}
            onEdit={onEdit}
            key={id ? `${id}-block_${index}` : `block_${index}`}
          />
        ))}
      </div>
    </MarkdownContext.Provider>
  )
}
