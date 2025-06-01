import type { UseChatHelpers } from '@ai-sdk/react'
import { Button } from '@connnect/ui/components/button'
import { CardTitle } from '@connnect/ui/components/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { RiDeleteBinLine } from '@remixicon/react'

export function ChatHeader({
  messages,
  setMessages,
}: Pick<UseChatHelpers, 'messages' | 'setMessages'>) {
  return (
    <div className="flex justify-between items-center h-8">
      <CardTitle className="flex items-center gap-2">
        AI Assistant
      </CardTitle>
      {messages.length > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="iconSm"
                onClick={() => setMessages([])}
              >
                <RiDeleteBinLine className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Clear chat history
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
