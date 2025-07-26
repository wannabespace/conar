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
import { useElementSize } from '@conar/ui/hookas/use-element-size'
import { useMountedEffect } from '@conar/ui/hookas/use-mounted-effect'
import { copy } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import { createContext, useContextSelector } from '@fluentui/react-context-selector'
import NumberFlow from '@number-flow/react'
import { RiArrowRightDoubleLine, RiCodeLine, RiFileCopyLine, RiText } from '@remixicon/react'
import { marked } from 'marked'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useRef, useState } from 'react'
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
  withAnimation?: boolean
}

const MarkdownContext = createContext<MarkdownContextType>(null!)

function useMarkdownContext<T>(selector: ContextSelector<MarkdownContextType, T>) {
  return useContextSelector(MarkdownContext, selector)
}

function Pre({ children, onEdit }: { children?: ReactNode, onEdit?: (content: string) => void }) {
  const withAnimation = useMarkdownContext(c => c.withAnimation)
  const childrenProps = (typeof children === 'object' && (children as ReactElement<{ children?: ReactNode, className?: string }>)?.props) || null
  const content = childrenProps?.children?.toString().trim() || null
  const lang = (childrenProps?.className?.split('-')[1] || 'text') as keyof typeof langsMap
  const [isLoading, setIsLoading] = useState(false)
  const [opened, setOpened] = useState(content ? content.split('\n').length < 10 : false)

  useMountedEffect(() => {
    if (!isLoading)
      setIsLoading(true)

    const timeout = setTimeout(() => {
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timeout)
  }, [content])

  useMountedEffect(() => {
    if (!isLoading && content && content.split('\n').length < 10) {
      setOpened(true)
    }
  }, [isLoading])

  if (!content)
    return null

  const lines = content.split('\n').length

  return (
    <motion.div
      className="typography-disabled relative my-4 first:mt-0 last:mb-0"
      initial={withAnimation ? { opacity: 0, height: 0 } : false}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
    >
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
                        disabled={isLoading}
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
    </motion.div>
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
  const withAnimation = useMarkdownContext(c => c.withAnimation)
  const ref = useRef<HTMLSpanElement>(null)
  const { height } = useElementSize(ref, {
    width: 0,
    height: 0,
  })

  if (typeof children === 'string') {
    return (
      <motion.p
        className={className}
        initial={withAnimation ? { opacity: 0, height: 0 } : false}
        animate={withAnimation ? { opacity: 1, height } : false}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
      >
        {withAnimation
          ? (
              <span ref={ref} className="block">
                {children.split('').map((char, index) => (
                  <span
                    key={index}
                    className={cn(withAnimation && 'animate-in fade-in duration-200')}
                  >
                    {char}
                  </span>
                ))}
              </span>
            )
          : children}
      </motion.p>
    )
  }

  return (
    <motion.p
      className={className}
      initial={withAnimation ? { opacity: 0, height: 0 } : false}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.p>
  )
}

function MarkdownBase({ content, onEdit }: { content: string, onEdit?: (content: string) => void }) {
  const withAnimation = useMarkdownContext(c => c.withAnimation)
  const processedContent = content.replace(/\n/g, '  \n')

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        pre: ({ children }) => <Pre children={children} onEdit={onEdit} />,
        table: MarkdownTable,
        thead: TableHeader,
        tbody: TableBody,
        tr: TableRow,
        p: P,
        ul: ({ children }) => withAnimation
          ? (
              <motion.ul
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.ul>
            )
          : <ul>{children}</ul>,
        ol: ({ children }) => withAnimation
          ? (
              <motion.ol
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.ol>
            )
          : <ol>{children}</ol>,
        li: ({ children }) => withAnimation
          ? (
              <motion.li
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.li>
            )
          : <li>{children}</li>,
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

const MarkdownBaseMotion = motion.create(MarkdownBase)

export function Markdown({
  content,
  id,
  className,
  onEdit,
  withAnimation,
  ...props
}: {
  content: string
  onEdit?: (content: string) => void
  withAnimation?: boolean
} & ComponentProps<'div'>) {
  const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content])

  return (
    <MarkdownContext.Provider value={{ withAnimation }}>
      <div className={cn('typography', className)} {...props}>
        <AnimatePresence>
          {blocks.map((block, index) => (
            <MarkdownBaseMotion
              key={id ? `${id}-block_${index}` : `block_${index}`}
              initial={withAnimation ? { opacity: 0, height: 0 } : false}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              content={block}
              onEdit={onEdit}
            />
          ))}
        </AnimatePresence>
      </div>
    </MarkdownContext.Provider>
  )
}
