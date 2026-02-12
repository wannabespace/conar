import type { ChangeEvent, ComponentRef } from 'react'
import { useChat } from '@ai-sdk/react'
import { getBase64FromFiles } from '@conar/shared/utils/base64'
import { isCtrlAndKey } from '@conar/shared/utils/os'
import { Button } from '@conar/ui/components/button'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Tooltip, TooltipContent, TooltipTrigger } from '@conar/ui/components/tooltip'
import { useKeyboardEvent } from '@conar/ui/hookas/use-keyboard-event'
import { useMountedEffect } from '@conar/ui/hookas/use-mounted-effect'
import { RiAttachment2, RiCheckLine, RiCornerDownLeftLine, RiMagicLine, RiStopCircleLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { useLocation, useRouter } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { useEffect, useEffectEvent, useRef } from 'react'
import { toast } from 'sonner'
import { TipTap } from '~/components/tiptap'
import { connectionStore } from '~/entities/connection/store'
import { useSubscription } from '~/entities/user/hooks'
import { orpcQuery } from '~/lib/orpc'
import { appStore, setIsSubscriptionDialogOpen } from '~/store'
import { Route } from '../..'
import { chatHooks } from '../../-page'
import { ChatImages } from './chat-images'

function Images({ connectionId }: { connectionId: string }) {
  const store = connectionStore(connectionId)
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
  const isOnline = useStore(appStore, state => state.isOnline)
  const { connection, chat } = Route.useLoaderData()
  const { error } = Route.useSearch()
  const router = useRouter()
  const location = useLocation()
  const { status, stop } = useChat({ chat })
  const elementRef = useRef<HTMLDivElement>(null)
  const ref = useRef<ComponentRef<typeof TipTap>>(null)
  const store = connectionStore(connection.id)
  const input = useStore(store, state => state.chatInput)
  const { subscription } = useSubscription()

  useEffect(() => {
    if (ref.current) {
      ref.current.editor.commands.focus('end')
    }
  }, [ref])

  const handleSend = async (value: string) => {
    if (!isOnline) {
      return
    }

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

      chatHooks.callHook('scrollToBottom')

      if (location.search.chatId !== chat.id) {
        router.navigate({
          to: '/database/$id/sql',
          params: { id: connection.id },
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
  }

  const handleSendEffect = useEffectEvent(handleSend)

  useEffect(() => {
    if (!error) {
      return
    }

    router.navigate({
      to: '.',
      search: { chatId: chat.id },
      replace: true,
    })
    handleSendEffect(error)
  }, [error, router, chat.id])

  useMountedEffect(() => {
    store.setState(state => ({
      ...state,
      chatInput: input,
    } satisfies typeof state))
  }, [input, store])

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

  useKeyboardEvent(e => isCtrlAndKey(e, 'n'), () => {
    router.navigate({
      to: '/database/$id/sql',
      params: { id: connection.id },
      search: { chatId: undefined },
    })
  }, {
    target: elementRef,
    deps: [chat.id],
  })

  return (
    <div
      ref={elementRef}
      className="flex flex-col gap-1"
    >
      <Images connectionId={connection.id} />
      <div className={`
        relative flex flex-col gap-2 overflow-hidden rounded-md border
        dark:bg-input/30
      `}
      >
        {!subscription && (
          <span
            className="z-10 bg-muted px-2 py-1 text-sm text-muted-foreground"
          >
            Please
            {' '}
            <Button
              variant="outline"
              className="px-1 py-0.5"
              size="xs"
              onClick={() => setIsSubscriptionDialogOpen(true)}
            >
              upgrade
            </Button>
            {' '}
            your subscription to generate SQL queries.
          </span>
        )}
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
          placeholder={isOnline ? 'Generate SQL queries using natural language' : 'Check your internet connection to generate SQL queries'}
          className={`
            max-h-[250px] min-h-[50px] overflow-y-auto p-2 text-sm outline-none
          `}
          disabled={!subscription || !isOnline}
          onEnter={handleSend}
          onImageAdd={(file) => {
            store.setState(state => ({
              ...state,
              files: [...store.state.files, file],
            } satisfies typeof state))
          }}
        />
        <div className={`
          pointer-events-none flex items-end justify-between px-2 pb-2
        `}
        >
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
          <div className="pointer-events-auto flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon-xs"
                  variant="outline"
                  className={input.length < 10 ? 'cursor-default opacity-50' : ''}
                  disabled={status === 'submitted' || status === 'streaming' || isEnhancingPrompt || !subscription}
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
                      activeContent={(
                        <RiCheckLine className="size-3 text-success" />
                      )}
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
