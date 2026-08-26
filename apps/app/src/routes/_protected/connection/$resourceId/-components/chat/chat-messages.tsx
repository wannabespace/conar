import { RiChatAiLine } from '@remixicon/react'
import { messageText } from '@tamery/ai/v2/message'
import { Bubble, BubbleContent } from '@tamery/ui/components/bubble'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@tamery/ui/components/empty'
import { Message, MessageContent } from '@tamery/ui/components/message'
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@tamery/ui/components/message-scroller'
import { Spinner } from '@tamery/ui/components/spinner'
import type { UIMessage } from '@tanstack/ai-react'

import { MessagePart } from './chat-message-part'

const ChatEmpty = () => (
  <Empty className="min-h-0 flex-1 p-4 md:p-4">
    <EmptyHeader className="gap-1">
      <EmptyMedia
        variant="icon"
        className="bg-muted/60 text-muted-foreground/70 mb-3 size-14 rounded-2xl [&_svg]:size-7"
      >
        <RiChatAiLine />
      </EmptyMedia>
      <EmptyTitle className="text-sm font-medium tracking-normal">
        Ask Anything
      </EmptyTitle>
      <EmptyDescription className="max-w-64 text-xs">
        Questions about your schema, SQL help, or anything else.
      </EmptyDescription>
    </EmptyHeader>
  </Empty>
)

export const ChatMessages = ({
  isPending,
  messages,
}: {
  isPending: boolean
  messages: UIMessage[]
}) => {
  if (messages.length === 0) {
    return isPending ? (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Spinner className="text-muted-foreground size-4" />
      </div>
    ) : (
      <ChatEmpty />
    )
  }

  return (
    <MessageScrollerProvider>
      <MessageScroller>
        <MessageScrollerViewport className="px-3">
          <MessageScrollerContent
            role="log"
            aria-label="Chat messages"
            className="gap-4 py-3"
          >
            {messages.map((message) => (
              <MessageScrollerItem
                key={message.id}
                messageId={message.id}
                scrollAnchor={message.role === 'user'}
              >
                {message.role === 'user' ? (
                  <Message align="end">
                    <MessageContent>
                      <Bubble align="end">
                        <BubbleContent data-mask>
                          {messageText(message)}
                        </BubbleContent>
                      </Bubble>
                    </MessageContent>
                  </Message>
                ) : (
                  <Message>
                    <MessageContent data-mask>
                      {message.parts.map((part, index) => (
                        <MessagePart key={index} part={part} />
                      ))}
                    </MessageContent>
                  </Message>
                )}
                {isPending && message === messages.at(-1) && (
                  <Message className="pt-2.5">
                    <MessageContent>
                      <Spinner className="text-muted-foreground size-4" />
                    </MessageContent>
                  </Message>
                )}
              </MessageScrollerItem>
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton className="absolute inset-x-0 bottom-3 mx-auto transition-[translate,opacity] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] data-[active=false]:pointer-events-none data-[active=false]:translate-y-2 data-[active=false]:opacity-0 data-[active=true]:translate-y-0 data-[active=true]:opacity-100" />
      </MessageScroller>
    </MessageScrollerProvider>
  )
}
