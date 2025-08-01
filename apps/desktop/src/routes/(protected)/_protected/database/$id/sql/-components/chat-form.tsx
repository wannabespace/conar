import type { ChangeEvent, ComponentRef } from 'react'
import { useChat } from '@ai-sdk/react'
import { getBase64FromFiles } from '@conar/shared/utils/base64'
import { Button } from '@conar/ui/components/button'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Tooltip, TooltipContent, TooltipTrigger } from '@conar/ui/components/tooltip'
import { useMountedEffect } from '@conar/ui/hookas/use-mounted-effect'
import { RiAttachment2, RiCheckLine, RiCornerDownLeftLine, RiMagicLine, RiStopCircleLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { TipTap } from '~/components/tiptap'
import { trpc } from '~/lib/trpc'
import { chatInput } from '../-chat'
import { pageHooks, pageStore } from '../-lib'
import { Route } from '../{-$chatId}'
import { ChatImages } from './chat-images'
import { useChatContext } from './chat-provider'

export function ChatForm() {
  const chat = useChatContext()
  const { database } = Route.useLoaderData()
  const [input, setInput] = useState(chatInput.get(database.id))
  const { status, stop } = useChat({ chat })
  const ref = useRef<ComponentRef<typeof TipTap>>(null)
  const files = useStore(pageStore, state => state.files.map(file => ({
    name: file.name,
    url: URL.createObjectURL(file),
  })))

  useEffect(() => {
    if (ref.current) {
      // TODO: fix focus
      ref.current.editor.commands.focus('end')
    }
  }, [ref])

  const handleSend = async (value: string) => {
    if (
      value.trim() === ''
      || chat.status === 'streaming'
      || chat.status === 'submitted'
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

      await chat.sendMessage({
        role: 'user',
        parts: [
          {
            type: 'text',
            text: cachedValue,
          },
          ...filesBase64.map(base64 => ({
            type: 'file' as const,
            url: base64,
            mediaType: 'image/png',
          })),
        ],
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

  const { mutate: enhancePrompt, isPending: isEnhancingPrompt } = useMutation({
    mutationFn: trpc.ai.enhancePrompt.mutate,
    onSuccess: (data) => {
      if (data === input) {
        toast.info('Prompt cannot be enhanced', {
          description: 'The prompt is already clear and specific',
        })
      }
      else {
        setInput(data)
      }
    },
  })

  const enhance = async () => {
    if (input.length < 10) {
      return
    }

    enhancePrompt({
      prompt: input,
      messages: chat.messages,
    })
  }

  // Handler for file input change
  const handleFileAttach = (e: ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files

    if (!fileList || fileList.length === 0)
      return

    const fileArr = Array.from(fileList)

    pageStore.setState(state => ({
      ...state,
      files: [...state.files, ...fileArr],
    }))
    e.target.value = ''
  }

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
        <div className="px-2 pb-2 flex justify-between items-end pointer-events-none">
          <div className="pointer-events-auto">
            <Button
              type="button"
              size="icon-xs"
              variant="outline"
              asChild
            >
              <label htmlFor="chat-file-upload">
                <RiAttachment2 className="size-3" />
                <input
                  id="chat-file-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileAttach}
                  tabIndex={-1}
                  aria-label="Attach files"
                />
              </label>
            </Button>
          </div>
          <div className="flex gap-2 pointer-events-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon-xs"
                  variant="outline"
                  className={input.length < 10 ? 'opacity-50 cursor-default' : ''}
                  disabled={status === 'submitted' || status === 'streaming' || isEnhancingPrompt}
                  onClick={enhance}
                >
                  <LoadingContent
                    loading={isEnhancingPrompt}
                    loaderClassName="size-3"
                  >
                    <ContentSwitch
                      active={isEnhancingPrompt}
                      activeContent={<RiCheckLine className="size-3 text-success" />}
                    >
                      <RiMagicLine className="size-3" />
                    </ContentSwitch>
                  </LoadingContent>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {input.length < 10 ? 'Prompt is too short to enhance' : 'Enhance prompt'}
              </TooltipContent>
            </Tooltip>
            {(status === 'streaming' || status === 'submitted')
              ? (
                  <Button
                    size="xs"
                    variant="outline"
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
