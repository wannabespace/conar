import type { chats, chatsMessages } from '~/drizzle'
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
import { RiAddLine, RiHistoryLine } from '@remixicon/react'
import { Link } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { useDrizzleLive } from '~/hooks/use-drizzle-live'
import { Route } from '..'
import { lastOpenedChatId } from '../-chat'

type Chat = typeof chats.$inferSelect & {
  messages: typeof chatsMessages.$inferSelect[]
}

type Group = 'today' | 'yesterday' | 'week' | 'month' | 'older'

const groupLabelMap: Record<Group, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  week: 'This Week',
  month: 'This Month',
  older: 'Older',
}

function groupChats(chats: Chat[]) {
  const groups: Record<Group, Chat[]> = {
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

  for (const chat of chats) {
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
  const { data = [] } = useDrizzleLive(db => db.query.chats.findMany({
    with: {
      messages: true,
    },
  }))

  const grouped = groupChats(data)

  return (
    <div className="flex justify-between items-center h-8">
      <CardTitle className="flex items-center gap-2">
        New Chat
      </CardTitle>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon-sm"
          asChild
          onClick={() => lastOpenedChatId.set(null)}
        >
          <Link
            to="/database/$id/sql"
            params={{ id }}
          >
            <RiAddLine className="size-4" />
          </Link>
        </Button>
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
              {data.length === 0
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
                              className="text-foreground"
                            >
                              {chat.title || `Chat #${chat.id}`}
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
