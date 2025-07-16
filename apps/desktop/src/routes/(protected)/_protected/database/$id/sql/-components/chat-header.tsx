import { useChat } from '@ai-sdk/react'
import { Button } from '@conar/ui/components/button'
import { CardTitle } from '@conar/ui/components/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { RiDeleteBinLine } from '@remixicon/react'
import { Route } from '..'

export function ChatHeader() {
  const { chat } = Route.useLoaderData()
  const { messages, setMessages } = useChat({ chat })

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
                size="icon-sm"
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
