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
import { useLocation, useRouter } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { TipTap } from '~/components/tiptap'
import { orpcQuery } from '~/lib/orpc'
import { Route } from '../..'
import { pageHooks } from '../../-page'
import { databaseStore } from '../../../../-store'
import { ChatImages } from './chat-images'

function Images({ databaseId }: { databaseId: string }) {
  const store = databaseStore(databaseId)
  const files = useStore(store, state => state.files)

  if (files.length === 0) {
    return null
  }

  const images = files.map(file => ({
    name: file.name,
    url: URL.createObjectURL(file),
  }))

  return (
    <ChatImages
      images={images}
      onRemove={(index) => {
        store.setState(state => ({
          ...state,
          files: store.state.files.filter((_, i) => i !== index),
        } satisfies typeof state))
      }}
    />
  )
}

export function ChatForm() {
  const { database, chat } = Route.useLoaderData()
  const { error } = Route.useSearch()
  const router = useRouter()
  const location = useLocation()
  const { status, stop } = useChat({ chat })
  const ref = useRef<ComponentRef<typeof TipTap>>(null)
  const store = databaseStore(database.id)
  const input = useStore(store, state => state.chatInput)

  useEffect(() => {
    if (ref.current) {
      ref.current.editor.commands.focus('end')
    }
  }, [ref])

  const handleSend = useCallback(async (value: string) => {
    if (
      value.trim() === ''
      || chat.status === 'streaming'
      || chat.status === 'submitted'
    ) {
      return
    }

    const cachedValue = value.trim()
    const cachedFiles = [...store.state.files]

    try {
      const filesBase64 = await getBase64FromFiles(cachedFiles)

      store.setState(state => ({
        ...state,
        chatInput: '',
        files: [],
      } satisfies typeof state))

      pageHooks.callHook('sendMessage')

      if (location.search.chatId !== chat.id) {
        router.navigate({
          to: '/database/$id/sql',
          params: { id: database.id },
          search: { chatId: chat.id },
          replace: true,
        })
      }

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
      store.setState(state => ({
        ...state,
        chatInput: cachedValue,
        files: cachedFiles,
      } satisfies typeof state))
      toast.error('Failed to send message', {
        description: error instanceof Error
          ? error.message
          : 'An unexpected error occurred. Please try again.',
      })
    }
  }, [router, location.search.chatId, chat, database.id, store])

  useEffect(() => {
    if (!error) {
      return
    }

    router.navigate({
      to: '.',
      search: { chatId: chat.id },
      replace: true,
    })
    handleSend(`Fix the following SQL error by correcting the current query: ${error}`)
  }, [error, handleSend, router, chat.id])

  useMountedEffect(() => {
    store.setState(state => ({
      ...state,
      chatInput: input,
    } satisfies typeof state))
  }, [input, store])

  // TODO: implement fix query
  // useEffect(() => {
  //   return pageHooks.hook('fix', async (error) => {
  //     await router.navigate({
  //       to: '/database/$id/sql',
  //       params: { id: database.id },
  //       search: { chatId: chat.id, error },
  //     })
  //   })
  // }, [router, database.id, chat.id])

  const { mutate: enhancePrompt, isPending: isEnhancingPrompt } = useMutation(orpcQuery.ai.enhancePrompt.mutationOptions({
    onSuccess: (data) => {
      if (input.length < 10) {
        return
      }

      if (data === input) {
        toast.info('Prompt cannot be enhanced', {
          description: 'The prompt is already clear and specific',
        })
      }
      else {
        store.setState(state => ({
          ...state,
          chatInput: data,
        } satisfies typeof state))
      }
    },
  }))

  // Handler for file input change
  const handleFileAttach = (e: ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files

    if (!fileList || fileList.length === 0)
      return

    const fileArr = Array.from(fileList)

    store.setState(state => ({
      ...state,
      files: [...store.state.files, ...fileArr],
    } satisfies typeof state))
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-1">
      <Images databaseId={database.id} />
      <div className="flex flex-col gap-2 relative dark:bg-input/30 rounded-md border">
        <TipTap
          ref={ref}
          data-mask
          value={input}
          setValue={(value) => {
            store.setState(state => ({
              ...state,
              chatInput: value,
            } satisfies typeof state))
          }}
          placeholder="Generate SQL query using natural language"
          className="min-h-[50px] max-h-[250px] p-2 text-sm outline-none overflow-y-auto"
          onEnter={handleSend}
          onImageAdd={(file) => {
            store.setState(state => ({
              ...state,
              files: [...store.state.files, file],
            } satisfies typeof state))
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
                  onClick={() => enhancePrompt({
                    prompt: input,
                    chatId: chat.id,
                  })}
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
