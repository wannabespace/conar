import type { ReactElement, ReactNode } from 'react'
import { Button } from '@connnect/ui/components/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { copy } from '@connnect/ui/lib/copy'
import { cn } from '@connnect/ui/lib/utils'
import { RiArrowRightSLine, RiFileCopyLine } from '@remixicon/react'
import { marked } from 'marked'
import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import { trackEvent } from '~/lib/events'
import { Monaco } from './monaco'

function Pre({ children, onEdit }: { children?: ReactNode, onEdit?: (content: string) => void }) {
  const childrenProps = (typeof children === 'object' && (children as ReactElement<{ children?: ReactNode, className?: string }>)?.props) || null
  const content = childrenProps?.children?.toString().trim() || null
  const lang = childrenProps?.className?.split('-')[1] || 'text'

  if (!content)
    return null

  return (
    <div className="typography-disabled relative my-6 first:mt-0 last:mb-0">
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
        className="rounded-md border overflow-hidden"
        style={{ height: `${Math.min(content.split('\n').length * 20, 200)}px` }}
      />
      <div className="flex justify-end gap-2 mt-2">
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="iconXs"
                  variant="outline"
                  onClick={() => {
                    copy(content)
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
            <Button
              size="xs"
              variant="outline"
              onClick={() => {
                onEdit(content)
                toast.success('Moved to runner')
                trackEvent('markdown_move_to_runner')
              }}
            >
              <RiArrowRightSLine className="size-3.5" />
              Move to runner
            </Button>
          )}
        </div>
      </div>
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

export function Markdown({ content, id, className, onEdit }: { content: string, id?: string, className?: string, onEdit?: (content: string) => void }) {
  const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content])

  return (
    <div className={cn('typography', className)}>
      {blocks.map((block, index) => (
        <MarkdownBase
          content={block}
          onEdit={onEdit}
          key={id ? `${id}-block_${index}` : `block_${index}`}
        />
      ))}
    </div>
  )
}
