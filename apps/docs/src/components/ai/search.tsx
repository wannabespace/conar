import type { UseChatHelpers } from '@ai-sdk/react'
import type { Tool, UIToolInvocation } from 'ai'
import type { ComponentProps, ReactNode, SyntheticEvent } from 'react'
import type { ChatUIMessage, SearchTool } from '../../routes/api.chat'
import { useChat } from '@ai-sdk/react'
import { Presence } from '@radix-ui/react-presence'
import { DefaultChatTransport } from 'ai'
import { Loader2, MessageCircleIcon, RefreshCw, SearchIcon, Send, X } from 'lucide-react'
import {
  createContext,
  use,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react'
import { cn } from '../../lib/cn'
import { Markdown } from '../markdown'
import { buttonVariants } from '../ui/button'

const Context = createContext<{
  open: boolean
  setOpen: (open: boolean) => void
  chat: UseChatHelpers<ChatUIMessage>
} | null>(null)

export function AISearchPanelHeader({ className, ...props }: ComponentProps<'div'>) {
  const { setOpen } = useAISearchContext()

  return (
    <div
      className={cn(
        `
          bg-fd-secondary text-fd-secondary-foreground sticky top-0 flex
          items-start gap-2 rounded-xl border shadow-sm
        `,
        className,
      )}
      {...props}
    >
      <div className="flex-1 px-3 py-2">
        <p className="mb-2 text-sm font-medium">AI Chat</p>
        <p className="text-fd-muted-foreground text-xs">
          AI can be inaccurate, please verify the answers.
        </p>
      </div>

      <button
        aria-label="Close"
        tabIndex={-1}
        className={cn(
          buttonVariants({
            size: 'icon-sm',
            color: 'ghost',
            className: 'text-fd-muted-foreground rounded-full',
          }),
        )}
        onClick={() => setOpen(false)}
      >
        <X />
      </button>
    </div>
  )
}

export function AISearchInputActions() {
  const { messages, status, setMessages, regenerate } = useChatContext()
  const isLoading = status === 'streaming'

  if (messages.length === 0)
    return null

  return (
    <>
      {!isLoading && messages.at(-1)?.role === 'assistant' && (
        <button
          type="button"
          className={cn(
            buttonVariants({
              color: 'secondary',
              size: 'sm',
              className: 'rounded-full gap-1.5',
            }),
          )}
          onClick={() => regenerate()}
        >
          <RefreshCw className="size-4" />
          Retry
        </button>
      )}
      <button
        type="button"
        className={cn(
          buttonVariants({
            color: 'secondary',
            size: 'sm',
            className: 'rounded-full',
          }),
        )}
        onClick={() => setMessages([])}
      >
        Clear Chat
      </button>
    </>
  )
}

const StorageKeyInput = '__ai_search_input'
export function AISearchInput(props: ComponentProps<'form'>) {
  const { status, sendMessage, stop } = useChatContext()
  const [input, setInput] = useState(() => localStorage.getItem(StorageKeyInput) ?? '')
  const isLoading = status === 'streaming' || status === 'submitted'
  const onStart = (e?: SyntheticEvent) => {
    e?.preventDefault()
    const message = input.trim()
    if (message.length === 0)
      return

    void sendMessage({
      role: 'user',
      parts: [
        {
          type: 'data-client',
          data: {
            location: location.href,
          },
        },
        {
          type: 'text',
          text: message,
        },
      ],
    })
    setInput('')
    localStorage.removeItem(StorageKeyInput)
  }

  useEffect(() => {
    if (isLoading)
      document.getElementById('nd-ai-input')?.focus()
  }, [isLoading])

  return (
    <form {...props} className={cn('flex items-start pe-2', props.className)} onSubmit={onStart}>
      <Input
        value={input}
        placeholder={isLoading ? 'AI is answering...' : 'Ask a question'}
        autoFocus
        className="p-3"
        disabled={status === 'streaming' || status === 'submitted'}
        onChange={(e) => {
          setInput(e.target.value)
          localStorage.setItem(StorageKeyInput, e.target.value)
        }}
        onKeyDown={(event) => {
          if (!event.shiftKey && event.key === 'Enter') {
            onStart(event)
          }
        }}
      />
      {isLoading
        ? (
            <button
              key="bn"
              type="button"
              className={cn(
                buttonVariants({
                  color: 'secondary',
                  className: 'transition-all rounded-full mt-2 gap-2',
                }),
              )}
              onClick={stop}
            >
              <Loader2 className="text-fd-muted-foreground size-4 animate-spin" />
              Abort Answer
            </button>
          )
        : (
            <button
              key="bn"
              type="submit"
              className={cn(
                buttonVariants({
                  color: 'primary',
                  className: 'transition-all rounded-full mt-2',
                }),
              )}
              disabled={input.length === 0}
            >
              <Send className="size-4" />
            </button>
          )}
    </form>
  )
}

function List(props: Omit<ComponentProps<'div'>, 'dir'>) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current)
      return
    function callback() {
      const container = containerRef.current
      if (!container)
        return

      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'instant',
      })
    }

    const observer = new ResizeObserver(callback)
    callback()

    const element = containerRef.current?.firstElementChild

    if (element) {
      observer.observe(element)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      {...props}
      className={cn('fd-scroll-container flex min-w-0 flex-col overflow-y-auto', props.className)}
    >
      {props.children}
    </div>
  )
}

function Input(props: ComponentProps<'textarea'>) {
  const ref = useRef<HTMLDivElement>(null)
  const shared = cn('col-start-1 row-start-1', props.className)

  return (
    <div className="grid flex-1">
      <textarea
        id="nd-ai-input"
        {...props}
        className={cn(
          `
            placeholder:text-fd-muted-foreground
            resize-none bg-transparent
            focus-visible:outline-none
          `,
          shared,
        )}
      />
      <div ref={ref} className={cn(shared, 'invisible break-all')}>
        {`${props.value?.toString() ?? ''}\n`}
      </div>
    </div>
  )
}

const roleName: Record<string, string> = {
  user: 'you',
  assistant: 'fumadocs',
}

function Message({ message, ...props }: { message: ChatUIMessage } & ComponentProps<'div'>) {
  let markdown = ''
  const searchCalls: UIToolInvocation<SearchTool>[] = []

  for (const part of message.parts ?? []) {
    if (part.type === 'text') {
      markdown += part.text
      continue
    }

    if (part.type.startsWith('tool-')) {
      const toolName = part.type.slice('tool-'.length)
      const p = part as UIToolInvocation<Tool>

      if (toolName !== 'search' || !p.toolCallId)
        continue
      searchCalls.push(p)
    }
  }

  return (
    <div onClick={e => e.stopPropagation()} {...props}>
      <p
        className={cn(
          'text-fd-muted-foreground mb-1 text-sm font-medium',
          message.role === 'assistant' && 'text-fd-primary',
        )}
      >
        {roleName[message.role] ?? 'unknown'}
      </p>
      <div className="prose text-sm">
        <Markdown text={markdown} />
      </div>

      {searchCalls.map((call) => {
        return (
          <div
            key={call.toolCallId}
            className="
              bg-fd-secondary text-fd-muted-foreground mt-3 flex flex-row
              items-center gap-2 rounded-lg border p-2 text-xs
            "
          >
            <SearchIcon className="size-4" />
            {call.state === 'output-error' || call.state === 'output-denied'
              ? (
                  <p className="text-fd-error">{call.errorText ?? 'Failed to search'}</p>
                )
              : (
                  <p>{!call.output ? 'Searching…' : `${call.output.length} search results`}</p>
                )}
          </div>
        )
      })}
    </div>
  )
}

export function AISearch({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const chat = useChat<ChatUIMessage>({
    id: 'search',
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  })

  return (
    <Context value={useMemo(() => ({ chat, open, setOpen }), [chat, open])}>{children}</Context>
  )
}

export function AISearchTrigger({
  position = 'default',
  className,
  ...props
}: ComponentProps<'button'> & { position?: 'default' | 'float' }) {
  const { open, setOpen } = useAISearchContext()

  return (
    <button
      data-state={open ? 'open' : 'closed'}
      className={cn(
        position === 'float' && [
          `
            fixed
            inset-e-[calc(--spacing(4)+var(--removed-body-scroll-bar-size,0))]
            bottom-4 z-20 w-24 gap-3 shadow-lg transition-[translate,opacity]
          `,
          open && 'translate-y-10 opacity-0',
        ],
        className,
      )}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {props.children}
    </button>
  )
}

export function AISearchPanel() {
  const { open, setOpen } = useAISearchContext()
  useHotKey()

  return (
    <>
      <style>
        {`
        @keyframes ask-ai-open {
          from {
            translate: 100% 0;
          }
          to {
            translate: 0 0;
          }
        }
        @keyframes ask-ai-close {
          from {
            width: var(--ai-chat-width);
          }
          to {
            width: 0px;
          }
        }`}
      </style>
      <Presence present={open}>
        <div
          className={cn(
            `
              bg-fd-overlay fixed inset-0 z-30 backdrop-blur-xs
              lg:hidden
            `,
            open ? 'animate-fd-fade-in' : 'animate-fd-fade-out',
          )}
          onClick={() => setOpen(false)}
        />
      </Presence>
      <Presence present={open}>
        <div
          className={cn(
            `
              bg-fd-card text-fd-card-foreground z-30 overflow-hidden
              [--ai-chat-width:400px]
              2xl:[--ai-chat-width:460px]
            `,
            `
              max-lg:fixed max-lg:inset-x-2 max-lg:inset-y-4 max-lg:rounded-2xl
              max-lg:border max-lg:shadow-xl
            `,
            `
              lg:sticky lg:top-0 lg:ms-auto lg:h-dvh lg:border-s
              lg:in-[#nd-docs-layout]:[grid-area:toc]
              lg:in-[#nd-notebook-layout]:col-start-5
              lg:in-[#nd-notebook-layout]:row-span-full
            `,
            open
              ? `
                animate-fd-dialog-in
                lg:animate-[ask-ai-open_200ms]
              `
              : `
                animate-fd-dialog-out
                lg:animate-[ask-ai-close_200ms]
              `,
          )}
        >
          <div className="
            flex size-full flex-col p-2
            lg:w-(--ai-chat-width) lg:p-3
          "
          >
            <AISearchPanelHeader />
            <AISearchPanelList className="flex-1" />
            <div className="
              bg-fd-secondary text-fd-secondary-foreground rounded-xl border
              shadow-sm
              has-focus-visible:shadow-md
            "
            >
              <AISearchInput />
              <div className="
                flex items-center gap-1.5 p-1
                empty:hidden
              "
              >
                <AISearchInputActions />
              </div>
            </div>
          </div>
        </div>
      </Presence>
    </>
  )
}

export function AISearchPanelList({ className, style, ...props }: ComponentProps<'div'>) {
  const chat = useChatContext()
  const messages = chat.messages.filter(msg => msg.role !== 'system')

  return (
    <List
      className={cn('overscroll-contain py-4', className)}
      style={{
        maskImage:
          'linear-gradient(to bottom, transparent, white 1rem, white calc(100% - 1rem), transparent 100%)',
        ...style,
      }}
      {...props}
    >
      {messages.length === 0
        ? (
            <div className="
              text-fd-muted-foreground/80 flex size-full flex-col items-center
              justify-center gap-2 text-center text-sm
            "
            >
              <MessageCircleIcon fill="currentColor" stroke="none" />
              <p onClick={e => e.stopPropagation()}>Start a new chat below.</p>
            </div>
          )
        : (
            <div className="flex flex-col gap-4 px-3">
              {chat.error && (
                <div className="
                  bg-fd-secondary text-fd-secondary-foreground rounded-lg border
                  p-2
                "
                >
                  <p className="text-fd-muted-foreground mb-1 text-xs">
                    Request Failed:
                    {' '}
                    {chat.error.name}
                  </p>
                  <p className="text-sm">{chat.error.message}</p>
                </div>
              )}
              {messages.map(item => (
                <Message key={item.id} message={item} />
              ))}
            </div>
          )}
    </List>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useHotKey() {
  const { open, setOpen } = useAISearchContext()

  const onKeyPress = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === 'Escape' && open) {
      setOpen(false)
      e.preventDefault()
    }

    if (e.key === '/' && (e.metaKey || e.ctrlKey) && !open) {
      setOpen(true)
      e.preventDefault()
    }
  })

  useEffect(() => {
    window.addEventListener('keydown', onKeyPress)
    return () => window.removeEventListener('keydown', onKeyPress)
  }, [])
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAISearchContext() {
  return use(Context)!
}

function useChatContext() {
  return use(Context)!.chat
}
