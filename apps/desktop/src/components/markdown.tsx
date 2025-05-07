import type { ReactElement, ReactNode } from 'react'
import { Accordion, AccordionContent, AccordionItem } from '@connnect/ui/components/accordion'
import { Button } from '@connnect/ui/components/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { copy } from '@connnect/ui/lib/copy'
import { cn } from '@connnect/ui/lib/utils'
import NumberFlow from '@number-flow/react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { RiArrowRightDoubleLine, RiArrowRightSLine, RiFileCopyLine } from '@remixicon/react'
import { marked } from 'marked'
import { AnimatePresence, motion } from 'motion/react'
import { createContext, use, useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import { trackEvent } from '~/lib/events'
import { Monaco } from './monaco'

const langsMap: Record<string, string> = {
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

const MarkdownContext = createContext<{
  loading: boolean
}>(null!)

function Pre({ children, onEdit }: { children?: ReactNode, onEdit?: (content: string) => void }) {
  const childrenProps = (typeof children === 'object' && (children as ReactElement<{ children?: ReactNode, className?: string }>)?.props) || null
  const content = childrenProps?.children?.toString().trim() || null
  const lang = childrenProps?.className?.split('-')[1] || 'text'
  const [isLoading, setIsLoading] = useState(false)
  const { loading } = use(MarkdownContext)
  const [opened, setOpened] = useState('')

  useEffect(() => {
    if (!loading) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    const timeout = setTimeout(() => {
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timeout)
  }, [content, loading])

  useEffect(() => {
    if (!isLoading && content && content.split('\n').length < 10) {
      setOpened('pre')
    }
  }, [content, isLoading])

  if (!content)
    return null

  const lines = content.split('\n').length

  return (
    <div className="typography-disabled relative my-6 first:mt-0 last:mb-0">
      <Accordion
        value={opened}
        onValueChange={setOpened}
        type="single"
        collapsible
      >
        <AccordionItem value="pre" className="rounded-md border! bg-background dark:bg-input/30 overflow-hidden">
          <AccordionPrimitive.Trigger asChild>
            <div className="cursor-pointer select-none flex justify-between items-center gap-2 p-1">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Button
                    size="iconXs"
                    variant="ghost"
                    className="w-5"
                  >
                    <RiArrowRightSLine className={cn('size-4 duration-150', opened === 'pre' && 'rotate-90')} />
                  </Button>
                  <span className="font-medium">
                    {langsMap[lang as keyof typeof langsMap] || lang}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  <NumberFlow value={lines} />
                  {' '}
                  line
                  {lines === 1 ? '' : 's'}
                </span>
                <AnimatePresence>
                  {isLoading && (
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
                        size="iconXs"
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
                {onEdit && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="iconXs"
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
          </AccordionPrimitive.Trigger>
          <AccordionContent className="overflow-hidden p-0">
            <Monaco
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

function MarkdownBase({ content, onEdit }: { content: string, onEdit?: (content: string) => void }) {
  const processedContent = content.replace(/\n/g, '  \n')

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        pre: preProps => <Pre {...preProps} onEdit={onEdit} />,
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
}: {
  content: string
  id?: string
  className?: string
  onEdit?: (content: string) => void
  loading?: boolean
}) {
  const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content])

  return (
    <MarkdownContext value={{ loading }}>
      <div className={cn('typography', className)}>
        {blocks.map((block, index) => (
          <MarkdownBase
            content={block}
            onEdit={onEdit}
            key={id ? `${id}-block_${index}` : `block_${index}`}
          />
        ))}
      </div>
    </MarkdownContext>
  )
}
