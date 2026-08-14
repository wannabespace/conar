import { RiAddLine, RiDeleteBin7Line, RiHistoryLine } from '@remixicon/react'
import { Button } from '@tamery/ui/components/button'
import { CardTitle } from '@tamery/ui/components/card'
import { ScrollArea } from '@tamery/ui/components/custom/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@tamery/ui/components/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { useLiveQuery } from '@tanstack/react-db'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { getMonth, getWeek, getYear, isToday, isYesterday } from 'date-fns'
import type { ComponentRef } from 'react'
import { useRef } from 'react'

import { Link } from '~/components/link'
import type { Chat } from '~/entities/chat/sync'
import { useCollections } from '~/entities/collections'
import { getConnectionResourceStore } from '~/entities/connection/store'

import { RemoveChatDialog } from './remove-chat-dialog'

const { useParams } = getRouteApi('/_protected/connection/$resourceId/query/')

type Group = 'today' | 'yesterday' | 'week' | 'month' | 'older'

const groupLabelMap: Record<Group, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  week: 'This Week',
  month: 'This Month',
  older: 'Older',
}

const groupChats = (data: Chat[]) => {
  const groups: Record<Group, Chat[]> = {
    today: [],
    yesterday: [],
    week: [],
    month: [],
    older: [],
  }

  const now = new Date()
  const thisWeek = getWeek(now)
  const thisMonth = getMonth(now)
  const thisYear = getYear(now)

  for (const chat of data) {
    const chatDate = new Date(chat.createdAt)

    if (isToday(chatDate)) {
      groups.today.push(chat)
    } else if (isYesterday(chatDate)) {
      groups.yesterday.push(chat)
    } else if (
      getYear(chatDate) === thisYear &&
      getWeek(chatDate) === thisWeek
    ) {
      groups.week.push(chat)
    } else if (
      getYear(chatDate) === thisYear &&
      getMonth(chatDate) === thisMonth
    ) {
      groups.month.push(chat)
    } else {
      groups.older.push(chat)
    }
  }

  return Object.fromEntries(
    Object.entries(groups).filter(([_, chats]) => chats.length > 0)
  ) as typeof groups
}

export const ChatHeader = ({ chatId }: { chatId: string }) => {
  const { resourceId } = useParams()
  const navigate = useNavigate()
  const store = getConnectionResourceStore(resourceId)
  const removeDialogRef = useRef<ComponentRef<typeof RemoveChatDialog>>(null)
  const { chatsCollection } = useCollections()
  const { data: allChats } = useLiveQuery(
    (q) =>
      q
        .from({ chats: chatsCollection })
        .orderBy(({ chats }) => chats.createdAt, 'desc'),
    [chatsCollection]
  )
  const chat = allChats.find((item) => item.id === chatId)

  const grouped = groupChats(allChats)

  return (
    <>
      <RemoveChatDialog ref={removeDialogRef} />
      <div className="flex h-8 items-center justify-between gap-2">
        <CardTitle className="flex min-w-0 flex-1 items-center gap-2">
          <span data-mask className="block min-w-0 truncate">
            {chat
              ? chat.title || (
                  <span className="bg-muted block h-4 w-30 animate-pulse rounded-md" />
                )
              : 'New Chat'}
          </span>
        </CardTitle>
        <div className="flex items-center gap-2">
          {chat && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="New chat"
                    onClick={() =>
                      store.set(
                        (state) =>
                          ({
                            ...state,
                            lastOpenedChatId: null,
                          }) satisfies typeof state
                      )
                    }
                    render={
                      <Link
                        to="/connection/$resourceId/query"
                        params={{ resourceId }}
                      />
                    }
                  />
                }
              >
                <RiAddLine className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="bottom">New chat</TooltipContent>
            </Tooltip>
          )}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger
                render={
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label="Chat history"
                      />
                    }
                  />
                }
              >
                <RiHistoryLine className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="bottom">Chat history</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="min-w-60">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Chats</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="max-h-[70vh]">
                  {allChats.length === 0 ? (
                    <DropdownMenuItem disabled>No chats found</DropdownMenuItem>
                  ) : (
                    Object.entries(grouped).map(([group, chats], idx) => (
                      <div key={group}>
                        <DropdownMenuLabel className="text-xs opacity-70">
                          {groupLabelMap[group as Group]}
                        </DropdownMenuLabel>
                        {chats.map((historyChat) => (
                          <DropdownMenuItem
                            key={historyChat.id}
                            className="group"
                            render={
                              <Link
                                to="/connection/$resourceId/query"
                                params={{ resourceId }}
                                search={{ chatId: historyChat.id }}
                                activateOn="click"
                                className={cn(
                                  `text-foreground flex items-center justify-between gap-2`,
                                  historyChat.id === chatId && `bg-accent`
                                )}
                              />
                            }
                          >
                            <span data-mask className="truncate">
                              {historyChat.title || (
                                <span className="bg-muted h-4 w-30 animate-pulse rounded-md" />
                              )}
                            </span>
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    className="hover:text-destructive -mr-1 opacity-0 transition-none group-hover:opacity-100"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      // oxlint-disable-next-line react/react-compiler -- event handler; dialog is imperative
                                      removeDialogRef.current?.remove(
                                        historyChat,
                                        () => {
                                          if (historyChat.id !== chatId) {
                                            return
                                          }
                                          store.set(
                                            (state) =>
                                              ({
                                                ...state,
                                                lastOpenedChatId: null,
                                              }) satisfies typeof state
                                          )
                                          navigate({
                                            to: '/connection/$resourceId/query',
                                            params: { resourceId },
                                          })
                                        }
                                      )
                                    }}
                                  />
                                }
                              >
                                <RiDeleteBin7Line className="size-3.5" />
                              </TooltipTrigger>
                              <TooltipContent>Delete Chat</TooltipContent>
                            </Tooltip>
                          </DropdownMenuItem>
                        ))}
                        {idx !== Object.keys(grouped).length - 1 && (
                          <DropdownMenuSeparator />
                        )}
                      </div>
                    ))
                  )}
                </ScrollArea>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  )
}
