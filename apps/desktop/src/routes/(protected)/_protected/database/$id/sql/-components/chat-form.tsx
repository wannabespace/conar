import type { UseChatHelpers } from '@ai-sdk/react'
import { AiSqlChatModel } from '@connnect/shared/enums/ai-chat-model'
import { Button } from '@connnect/ui/components/button'
import { Popover, PopoverContent, PopoverTrigger } from '@connnect/ui/components/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@connnect/ui/components/select'
import { RiCornerDownLeftLine, RiStopCircleLine } from '@remixicon/react'
import { useParams } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { Monaco } from '~/components/monaco'
import { TipTap } from '~/components/tiptap'
import { pageStore } from '..'
import { useDatabaseContext } from '../-hooks/use-database-chat'
import { ChatImages } from './chat-images'

function ModelSelector() {
  const model = useStore(pageStore, state => state.model)

  return (
    <Select
      value={model}
      onValueChange={value => pageStore.setState(state => ({
        ...state,
        model: value as AiSqlChatModel | 'auto',
      }))}
    >
      <SelectTrigger size="xs">
        <div className="flex items-center gap-1">
          {model === 'auto' && (
            <span className="text-muted-foreground">
              Model
            </span>
          )}
          <SelectValue placeholder="Select model" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="auto">Auto</SelectItem>
        <SelectItem value={AiSqlChatModel.Claude_3_7_Sonnet}>Claude 3.7 Sonnet</SelectItem>
        <SelectItem value={AiSqlChatModel.GPT_4o_Mini}>GPT-4o Mini</SelectItem>
        <SelectItem value={AiSqlChatModel.Gemini_2_5_Pro}>Gemini 2.5 Pro</SelectItem>
        <SelectItem value={AiSqlChatModel.Grok_3}>Grok 3</SelectItem>
      </SelectContent>
    </Select>
  )
}
function SchemaProvider() {
  const { id } = useParams({ from: '/(protected)/_protected/database/$id/sql/' })
  const { data: context } = useDatabaseContext(id)

  return (
    <div className="text-xs text-center text-muted-foreground truncate">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="link"
            className="text-xs p-0 h-auto text-muted-foreground opacity-50"
          >
            Database schema provided to assistant.
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[500px] p-0" side="top" sideOffset={10}>
          <Monaco
            language="json"
            className="h-[80vh]"
            value={JSON.stringify(context, null, 2)}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              folding: true,
              foldingStrategy: 'indentation',
              stickyScroll: {
                enabled: false,
              },
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export function ChatForm({
  input,
  setInput,
  status,
  stop,
  handleSend,
}: {
  input: string
  setInput: (input: string) => void
  status: UseChatHelpers['status']
  stop: UseChatHelpers['stop']
  handleSend: (input: string) => void
}) {
  const files = useStore(pageStore, state => state.files.map(file => ({
    name: file.name,
    url: URL.createObjectURL(file),
  })))

  return (
    <>
      {files.length > 0 && (
        <ChatImages
          images={files}
          onRemove={(index) => {
            pageStore.setState(state => ({
              ...state,
              files: state.files.filter((_, i) => i !== index),
            }))
          }}
        />
      )}
      <div className="flex flex-col gap-2 relative bg-background dark:bg-input/20 rounded-md border">
        <TipTap
          value={input}
          setValue={setInput}
          placeholder="Generate SQL query using natural language"
          className="min-h-[50px] max-h-[250px] p-2 text-sm outline-none overflow-y-auto"
          onEnter={handleSend}
          onImageAdd={(file) => {
            pageStore.setState(state => ({
              ...state,
              files: [...state.files, file],
            }))
          }}
        />
        <div className="px-2 pb-2 flex justify-between pointer-events-none">
          <div className="pointer-events-auto">
            <ModelSelector />
          </div>
          <div className="flex gap-2 pointer-events-auto">
            {(status === 'streaming' || status === 'submitted')
              ? (
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    disabled={status === 'submitted'}
                    onClick={stop}
                  >
                    <RiStopCircleLine className="size-3" />
                    Stop
                  </Button>
                )
              : (
                  <Button
                    size="xs"
                    disabled={!input.trim()}
                    onClick={() => handleSend(input)}
                  >
                    Send
                    <RiCornerDownLeftLine className="size-3" />
                  </Button>
                )}
          </div>
        </div>
      </div>
      <SchemaProvider />
    </>
  )
}
