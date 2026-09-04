import { AiChat01Icon } from '@hugeicons/core-free-icons'
import type { AppUIMessage } from '@tamery/ai/message'
import { textFromMessage } from '@tamery/ai/message'
import { Bubble, BubbleContent } from '@tamery/ui/components/bubble'
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

import { PaneEmpty } from '~/components/pane-empty'

import { MessagePart } from './chat-message-part'

const ChatEmpty = () => (
  <PaneEmpty
    icon={AiChat01Icon}
    title="Ask Anything"
    description="Questions about your schema, SQL help, or anything else."
  />
)

export const ChatMessages = ({
  isPending,
  lastSentId,
  messages,
}: {
  isPending: boolean
  lastSentId: string | undefined
  messages: AppUIMessage[]
}) => {
  if (messages.length === 0) {
    return <ChatEmpty />
  }

  return (
    <MessageScrollerProvider autoScroll>
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
                scrollAnchor={message.id === lastSentId}
              >
                {message.role === 'user' ? (
                  <Message align="end">
                    <MessageContent>
                      <Bubble align="end">
                        <BubbleContent data-mask>
                          {textFromMessage(message)}
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
