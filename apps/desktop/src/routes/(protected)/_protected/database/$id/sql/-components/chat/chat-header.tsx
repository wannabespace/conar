import type { AppUIMessage } from '@conar/api/src/ai-tools'
import type { chats } from '~/drizzle'
import { Button } from '@conar/ui/components/button'
import { CardTitle } from '@conar/ui/components/card'
import { ScrollArea } from '@conar/ui/components/custom/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@conar/ui/components/dropdown-menu'
import { cn } from '@conar/ui/lib/utils'
import { RiAddLine, RiDeleteBin7Line, RiHistoryLine } from '@remixicon/react'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { Link, useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { useEffect, useEffectEvent } from 'react'
import { toast } from 'sonner'
import { chatsCollection, chatsMessagesCollection } from '~/entities/chat'
import { databaseStore } from '~/entities/database'
import { orpc } from '~/lib/orpc'
import { Route } from '../..'

type Group = 'today' | 'yesterday' | 'week' | 'month' | 'older'

const groupLabelMap: Record<Group, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  week: 'This Week',
  month: 'This Month',
  older: 'Older',
}

function groupChats(data: typeof chats.$inferSelect[]) {
  const groups: Record<Group, typeof chats.$inferSelect[]> = {
    today: [],
    yesterday: [],
    week: [],
    month: [],
    older: [],
  }

  const now = dayjs()
  const thisWeek = now.week()
  const thisMonth = now.month()
  const thisYear = now.year()

  for (const chat of data) {
    const chatDate = dayjs(chat.createdAt)

    if (chatDate.isToday()) {
      groups.today.push(chat)
    }
    else if (chatDate.isYesterday()) {
      groups.yesterday.push(chat)
    }
    else if (chatDate.year() === thisYear && chatDate.week() === thisWeek) {
      groups.week.push(chat)
    }
    else if (chatDate.year() === thisYear && chatDate.month() === thisMonth) {
      groups.month.push(chat)
    }
    else {
      groups.older.push(chat)
    }
  }

  return Object.fromEntries(
    Object.entries(groups).filter(([_, chats]) => chats.length > 0),
  ) as typeof groups
}

export function ChatHeader({ chatId }: { chatId: string }) {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const store = databaseStore(id)
  const { data: allChats } = useLiveQuery(q => q.from({ chats: chatsCollection }).orderBy(({ chats }) => chats.createdAt, 'desc'))
  const chat = allChats.find(chat => chat.id === chatId)
  const { data: messages } = useLiveQuery(q => q
    .from({ chatsMessages: chatsMessagesCollection })
    .where(({ chatsMessages }) => eq(chatsMessages.chatId, chatId)))
  const shouldGenerateTitle = !!chat && chat.title === null && messages.length > 0

  const generateTitleEvent = useEffectEvent(async () => {
    if (!chat) {
      return
    }

    const title = await orpc.ai.generateTitle({
      chatId: chat.id,
      messages: messages as AppUIMessage[],
    })

    chatsCollection.update(chat.id, (draft) => {
      draft.title = title
    })
  })

  useEffect(() => {
    if (!shouldGenerateTitle) {
      return
    }

    generateTitleEvent()
  }, [shouldGenerateTitle])

  const grouped = groupChats(allChats)

  return (
    <div className="flex h-8 items-center justify-between gap-2">
      <CardTitle className="flex min-w-0 flex-1 items-center gap-2">
        <span data-mask className="block min-w-0 truncate">
          {chat
            ? (
                <>
                  {chat.title || (
                    <span className={`
                      block h-4 w-30 animate-pulse rounded-md bg-muted
                    `}
                    />
                  )}
                </>
              )
            : 'New Chat'}
        </span>
      </CardTitle>
      <div className="flex items-center gap-2">
        {chat && (
          <Button
            variant="outline"
            size="icon-sm"
            asChild
            onClick={() => store.setState(state => ({
              ...state,
              lastOpenedChatId: null,
            } satisfies typeof state))}
          >
            <Link
              to="/database/$id/sql"
              params={{ id }}
            >
              <RiAddLine className="size-4" />
            </Link>
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
            >
              <RiHistoryLine className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-60">
            <DropdownMenuLabel>Chats</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="max-h-[70vh]">
              {allChats.length === 0
                ? <DropdownMenuItem disabled>No chats found</DropdownMenuItem>
                : (
                    Object.entries(grouped).map(([group, chats], idx) => (
                      <div key={group}>
                        <DropdownMenuLabel className="text-xs opacity-70">{groupLabelMap[group as Group]}</DropdownMenuLabel>
                        {chats.map(chat => (
                          <DropdownMenuItem
                            key={chat.id}
                            asChild
                            className="group"
                          >
                            <Link
                              to="/database/$id/sql"
                              params={{ id }}
                              search={{ chatId: chat.id }}
                              className={cn(`
                                flex items-center justify-between gap-2
                                text-foreground
                              `, chat.id === chatId && `bg-accent`)}
                            >
                              <span className="truncate">
                                {chat.title || (
                                  <span className={`
                                    h-4 w-30 animate-pulse rounded-md bg-muted
                                  `}
                                  />
                                )}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                className={`
                                  -mr-1 opacity-0 transition-opacity
                                  group-hover:opacity-100
                                  hover:text-destructive
                                `}
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  chatsCollection.delete(chat.id)
                                  orpc.chats.remove({ id: chat.id })
                                  toast.success('Chat deleted')
                                  if (chat.id === chatId) {
                                    store.setState(state => ({
                                      ...state,
                                      lastOpenedChatId: null,
                                    }))
                                    navigate({
                                      to: '/database/$id/sql',
                                      params: { id },
                                    })
                                  }
                                }}
                              >
                                <RiDeleteBin7Line className="size-4" />
                              </Button>
                            </Link>
                          </DropdownMenuItem>
                        ))}
                        {idx !== Object.keys(grouped).length - 1 && <DropdownMenuSeparator />}
                      </div>
                    ))
                  )}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
