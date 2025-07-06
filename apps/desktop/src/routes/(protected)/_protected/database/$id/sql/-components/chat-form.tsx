import type { UseChatHelpers } from '@ai-sdk/react'
import type { ComponentRef } from 'react'
import type { Database } from '~/lib/indexeddb'
import { AiSqlChatModel } from '@conar/shared/enums/ai-chat-model'
import { getBase64FromFiles } from '@conar/shared/utils/base64'
import { Button } from '@conar/ui/components/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@conar/ui/components/select'
import { useMountedEffect } from '@conar/ui/hookas/use-mounted-effect'
import { RiCornerDownLeftLine, RiStopCircleLine } from '@remixicon/react'
import { useStore } from '@tanstack/react-store'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { TipTap } from '~/components/tiptap'
import { databaseContextQuery } from '~/entities/database'
import { queryClient } from '~/main'
import { pageHooks, pageStore } from '..'
import { chatInput } from '../-lib'
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
        <SelectItem value={AiSqlChatModel.Claude_4_Opus}>Claude 4 Opus</SelectItem>
        <SelectItem value={AiSqlChatModel.GPT_4o_Mini}>GPT-4o Mini</SelectItem>
        <SelectItem value={AiSqlChatModel.Gemini_2_5_Pro}>Gemini 2.5 Pro</SelectItem>
        <SelectItem value={AiSqlChatModel.Grok_3}>Grok 3</SelectItem>
      </SelectContent>
    </Select>
  )
}

export function ChatForm({
  database,
  append,
  stop,
  status,
  input,
  setInput,
}: Pick<UseChatHelpers, 'status' | 'append' | 'stop' | 'input' | 'setInput'> & { database: Database }) {
  const ref = useRef<ComponentRef<typeof TipTap>>(null)
  const files = useStore(pageStore, state => state.files.map(file => ({
    name: file.name,
    url: URL.createObjectURL(file),
  })))

  useEffect(() => {
    if (ref.current) {
      ref.current.editor.commands.focus('end')
    }
  }, [ref])

  const statusRef = useRef(status)

  useEffect(() => {
    // status variable is cached due to memoization inside tiptap
    statusRef.current = status
  }, [status])

  const handleSend = async (value: string) => {
    if (
      value.trim() === ''
      || statusRef.current === 'streaming'
      || statusRef.current === 'submitted'
    ) {
      return
    }

    const cachedValue = value.trim()
    const cachedFiles = [...pageStore.state.files]

    try {
      const filesBase64 = await getBase64FromFiles(cachedFiles)

      setInput('')
      pageStore.setState(state => ({
        ...state,
        files: [],
      }))

      pageHooks.callHook('sendMessage')

      await append({
        role: 'user',
        content: cachedValue,
      }, {
        experimental_attachments: filesBase64.map((base64, index) => ({
          name: `attachment-${index + 1}.png`,
          contentType: 'image/png',
          url: base64,
        })),
        body: {
          context: await queryClient.ensureQueryData(databaseContextQuery(database)),
        },
      })
    }
    catch (error) {
      setInput(cachedValue)
      pageStore.setState(state => ({
        ...state,
        files: cachedFiles,
      }))
      toast.error('Failed to send message', {
        description: error instanceof Error
          ? error.message
          : 'An unexpected error occurred. Please try again.',
      })
    }
  }

  useMountedEffect(() => {
    chatInput.set(database.id, input)
  }, [input])

  useEffect(() => {
    return pageHooks.hook('fix', async (error) => {
      await handleSend(`Fix the following SQL error by correcting the current query: ${error}`)
    })
  }, [handleSend])

  return (
    <div className="flex flex-col gap-1">
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
      <div className="flex flex-col gap-2 relative dark:bg-input/30 rounded-md border">
        <TipTap
          ref={ref}
          data-mask
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
    </div>
  )
}
