import {
  RiChatNewLine,
  RiCheckLine,
  RiCloseLine,
  RiHistoryLine,
} from '@remixicon/react'
import { Button } from '@tamery/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@tamery/ui/components/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'

export const ChatHeader = ({
  activeChatId,
  history,
  onClose,
  onNewChat,
  onSelectChat,
  title,
}: {
  activeChatId: string
  history: { id: string; title: string | null }[]
  onClose: () => void
  onNewChat: () => void
  onSelectChat: (chatId: string) => void
  title: string | null
}) => (
  <div className="flex h-8 shrink-0 items-center gap-0.5 border-b pr-1 pl-3">
    <span data-mask className="min-w-0 flex-1 truncate text-sm font-medium">
      {title || 'New Chat'}
    </span>
    {history.length > 0 && (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button size="icon-xs" variant="ghost" aria-label="Chat history" />
          }
        >
          <RiHistoryLine />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="max-h-[70vh] min-w-56 overflow-auto"
        >
          {history.map((chat) => (
            <DropdownMenuItem
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
            >
              <span data-mask className="truncate">
                {chat.title || 'New Chat'}
              </span>
              {chat.id === activeChatId && (
                <RiCheckLine className="text-muted-foreground ml-auto size-4" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )}
    {[
      { Icon: RiChatNewLine, label: 'New chat', onClick: onNewChat },
      { Icon: RiCloseLine, label: 'Close chat', onClick: onClose },
    ].map(({ Icon, label, onClick }) => (
      <Tooltip key={label}>
        <TooltipTrigger
          render={
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label={label}
              onClick={onClick}
            />
          }
        >
          <Icon className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent side="bottom">{label}</TooltipContent>
      </Tooltip>
    ))}
  </div>
)
