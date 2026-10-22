import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import { useStickToBottom } from 'use-stick-to-bottom'

export const CopyLog = ({ lines }: { lines: string[] }) => {
  const { contentRef, scrollRef } = useStickToBottom({ initial: 'instant' })

  return (
    <div className="bg-card overflow-hidden rounded-xl border">
      <ScrollArea ref={scrollRef} className="h-72">
        <div
          ref={contentRef}
          data-mask
          className="p-3 font-mono text-xs break-all whitespace-pre-wrap select-text"
        >
          {lines.join('\n')}
        </div>
      </ScrollArea>
    </div>
  )
}
