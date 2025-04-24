import { AiSqlChatModel } from '@connnect/shared/enums/ai-chat-model'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@connnect/ui/components/select'
import { useStore } from '@tanstack/react-store'
import { TipTap } from '~/components/tiptap'
import { pageStore } from '..'
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

export function ChatForm({
  input,
  setInput,
  onEnter,
  actions,
}: {
  input: string
  setInput: (input: string) => void
  onEnter: (input: string) => void
  actions: React.ReactNode
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
      <div className="flex flex-col gap-2 relative bg-background dark:bg-input/30 rounded-md border border-input">
        <TipTap
          value={input}
          setValue={setInput}
          placeholder="Generate SQL query using natural language"
          className="min-h-[50px] max-h-[250px] p-2 text-sm outline-none overflow-y-auto"
          onEnter={onEnter}
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
            {actions}
          </div>
        </div>
      </div>
      <div className="text-xs text-center text-muted-foreground">
        AI can make mistakes.
      </div>
    </>
  )
}
