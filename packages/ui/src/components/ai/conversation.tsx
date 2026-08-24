import { Button } from '@conar/ui/components/button'
import { cn } from '@conar/ui/lib/utils'
import { RiArrowDownLine } from '@remixicon/react'
import * as React from 'react'

const ConversationContext = React.createContext<{
  isAtBottom: boolean
  scrollToBottom: () => void
} | null>(null)

function useConversation() {
  const context = React.use(ConversationContext)

  if (!context) {
    throw new Error('useConversation must be used within a Conversation')
  }

  return context
}

export function Conversation({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = React.useState(true)
  const stickToBottomRef = React.useRef(true)

  const scrollToBottom = React.useCallback(() => {
    stickToBottomRef.current = true
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [])

  React.useEffect(() => {
    const element = scrollRef.current

    if (!element) {
      return
    }

    const handleScroll = () => {
      const distance = element.scrollHeight - element.scrollTop - element.clientHeight
      const atBottom = distance < 40

      stickToBottomRef.current = atBottom
      setIsAtBottom(atBottom)
    }

    const observer = new ResizeObserver(() => {
      if (stickToBottomRef.current) {
        element.scrollTop = element.scrollHeight
      }
    })

    observer.observe(element)

    for (const child of element.children) {
      observer.observe(child)
    }

    element.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      observer.disconnect()
      element.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const contextValue = React.useMemo(
    () => ({ isAtBottom, scrollToBottom }),
    [isAtBottom, scrollToBottom],
  )

  return (
    <ConversationContext value={contextValue}>
      <div data-slot="conversation" className={cn('relative min-h-0 flex-1', className)} {...props}>
        <div ref={scrollRef} className="h-full overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </ConversationContext>
  )
}

export function ConversationContent({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  return (
    <div
      data-slot="conversation-content"
      className={cn('flex flex-col gap-4 p-4', className)}
      {...props}
    />
  )
}

export function ConversationScrollButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>): React.ReactElement | null {
  const { isAtBottom, scrollToBottom } = useConversation()

  if (isAtBottom) {
    return null
  }

  return (
    <Button
      data-slot="conversation-scroll-button"
      variant="outline"
      size="icon-sm"
      className={cn(
        'absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full shadow-md',
        className,
      )}
      aria-label="Scroll to bottom"
      onClick={scrollToBottom}
      {...props}
    >
      <RiArrowDownLine />
    </Button>
  )
}
