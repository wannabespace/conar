import type { AppUIMessage } from '@conar/shared/ai-tools'
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
import { useAsyncEffect } from '@conar/ui/hookas/use-async-effect'
import { cn } from '@conar/ui/lib/utils'
import { RiAddLine, RiHistoryLine } from '@remixicon/react'
import { Link } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { eq } from 'drizzle-orm'
import { useMemo } from 'react'
import { chats, db } from '~/drizzle'
import { useChatsLive } from '~/entities/chat/lib/fetching'
import { orpc } from '~/lib/orpc'
import { Route } from '..'
import { lastOpenedChatId } from '../-chat'

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

export function ChatHeader() {
  const { id } = Route.useParams()
  const { chatId } = Route.useSearch()
  const { data } = useChatsLive(id)
  const currentChat = useMemo(() => data?.find(chat => chat.id === chatId), [data, chatId])
  const shouldGenerateTitle = !!currentChat && currentChat.title === null

  useAsyncEffect(async () => {
    if (!shouldGenerateTitle) {
      return
    }

    const title = await orpc.ai.generateTitle({
      chatId: currentChat.id,
      messages: currentChat.messages as AppUIMessage[],
    })

    await db.update(chats).set({ title }).where(eq(chats.id, currentChat.id))
  }, [shouldGenerateTitle])

  const grouped = data ? groupChats(data) : {} as ReturnType<typeof groupChats>

  return (
    <div className="flex justify-between items-center h-8 gap-2">
      <CardTitle className="flex items-center gap-2 flex-1 min-w-0">
        <span className="truncate block min-w-0">
          {chatId
            ? <>{currentChat?.title || <span className="block animate-pulse bg-muted rounded-md w-30 h-4" />}</>
            : 'New Chat'}
        </span>
      </CardTitle>
      <div className="flex items-center gap-2">
        {chatId && (
          <Button
            variant="outline"
            size="icon-sm"
            asChild
            onClick={() => lastOpenedChatId.set(id, null)}
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
              {data && data.length === 0
                ? <DropdownMenuItem disabled>No chats found</DropdownMenuItem>
                : (
                    Object.entries(grouped).map(([group, chats], idx) => (
                      <div key={group}>
                        <DropdownMenuLabel className="opacity-70 text-xs">{groupLabelMap[group as Group]}</DropdownMenuLabel>
                        {chats.map(chat => (
                          <DropdownMenuItem
                            key={chat.id}
                            asChild
                          >
                            <Link
                              to="/database/$id/sql"
                              params={{ id }}
                              search={{ chatId: chat.id }}
                              className={cn('text-foreground', chat.id === chatId && 'bg-accent')}
                            >
                              {chat.title || <span className="animate-pulse bg-muted rounded-md w-30 h-4" />}
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
