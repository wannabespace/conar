import type { Message } from '@ai-sdk/react'
import { useChat } from '@ai-sdk/react'
import { DatabaseType } from '@connnect/shared/enums/database-type'
import { Avatar, AvatarFallback } from '@connnect/ui/components/avatar'
import { Button } from '@connnect/ui/components/button'
import { CardTitle } from '@connnect/ui/components/card'
import { LoadingContent } from '@connnect/ui/components/custom/loading-content'
import { Input } from '@connnect/ui/components/input'
import { DotPattern } from '@connnect/ui/components/magicui/dot-pattern'
import { ScrollArea } from '@connnect/ui/components/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { useCopy } from '@connnect/ui/hooks/use-copy'
import { RiDeleteBinLine, RiFileCopyLine, RiQuestionAnswerLine, RiSendPlane2Line, RiStopLine } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { Monaco } from '~/components/monaco'
import { getDatabaseContext, useDatabase } from '~/entities/database'
import { UserAvatar } from '~/entities/user'

const chatHistory = {
  get(id: string) {
    return JSON.parse(localStorage.getItem(`sql-chat-history-${id}`) || '[]')
  },
  set(id: string, messages: Message[]) {
    localStorage.setItem(`sql-chat-history-${id}`, JSON.stringify(messages))
  },
}

export function SqlChat() {
  const { id } = useParams({ from: '/(protected)/_protected/database/$id' })
  const { data: database } = useDatabase(id)
  const { copy } = useCopy(() => toast.success('Copied to clipboard'))
  const { data: context } = useQuery({
    queryKey: ['database-context', id],
    queryFn: () => getDatabaseContext(database),
  })
  const { messages, stop, input, handleInputChange, handleSubmit, status, setMessages } = useChat({
    initialMessages: chatHistory.get(id),
    api: `${import.meta.env.VITE_PUBLIC_API_URL}/ai/sql-chat`,
    sendExtraMessageFields: true,
    body: {
      type: DatabaseType.Postgres,
      context,
    },
  })

  useEffect(() => {
    chatHistory.set(id, messages)
  }, [id, messages])

  return (
    <div className="relative flex h-screen flex-col justify-between gap-2 p-4">
      <DotPattern
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={1}
        className="absolute -z-10 top-0 left-0 opacity-50 [mask-image:linear-gradient(to_bottom_left,white,transparent,transparent)]"
      />
      <div className="flex justify-between mb-4">
        <div>
          <CardTitle>SQL Runner</CardTitle>
        </div>
        {/* <Button variant="outline" size="icon">
          <RiHistoryLine className="size-4" />
        </Button> */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
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
      </div>
      {messages.length === 0 && (
        <div className="pointer-events-none absolute z-10 inset-0 flex justify-center items-center px-6">
          <div className="pointer-events-auto text-center text-balance max-w-96">
            <RiQuestionAnswerLine className="mx-auto mb-2 size-8" />
            <p className="text-sm">Ask AI to generate SQL queries</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Try asking for
              <span className="font-mono">SELECT</span>
              {' '}
              queries to fetch data,
              <span className="font-mono">INSERT</span>
              {' '}
              statements to add records,
              <span className="font-mono">UPDATE</span>
              {' '}
              to modify existing data, or complex
              <span className="font-mono">JOIN</span>
              s across multiple tables.
            </p>
          </div>
        </div>
      )}
      <ScrollArea className="flex-1 overflow-y-auto -mx-4 px-4">
        <div className="flex flex-col gap-4 pb-2">
          {messages.map(message => (
            <div key={message.id} className="flex flex-col gap-2 mb-4">
              {message.role === 'user'
                ? (
                    <>
                      <UserAvatar />
                      <div className="text-sm">
                        {message.content}
                      </div>
                    </>
                  )
                : (
                    <>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6">
                          <AvatarFallback className="text-xs">AI</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="overflow-hidden border rounded-md">
                        <Monaco
                          initialValue={message.content}
                          onChange={() => {}}
                          options={{
                            readOnly: true,
                            lineNumbers: 'off',
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            folding: false,
                          }}
                          style={{ height: `${Math.min(message.content.split('\n').length * 20, 200)}px` }}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => copy(message.content)}>
                          <RiFileCopyLine className="size-3.5 mr-1" />
                          Copy
                        </Button>
                      </div>
                    </>
                  )}
            </div>
          ))}
        </div>
      </ScrollArea>
      <form
        className="flex gap-2"
        onSubmit={handleSubmit}
      >
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Generate SQL query using natural language"
        />
        <Button disabled={!input || status === 'submitted' || status === 'streaming'} type="submit" size="icon">
          <LoadingContent loading={status === 'submitted' || status === 'streaming'}>
            <RiSendPlane2Line />
          </LoadingContent>
        </Button>
        {(status === 'submitted' || status === 'streaming') && (
          <Button type="button" size="icon" variant="outline" onClick={stop}>
            <RiStopLine />
          </Button>
        )}
      </form>
    </div>
  )
}
