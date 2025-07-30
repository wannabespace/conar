import type { Chat } from '@ai-sdk/react'
import type { AppUIMessage } from '@conar/shared/ai'
import { createContext, use } from 'react'

export const ChatContext = createContext<Chat<AppUIMessage>>(null!)

export function useChatContext() {
  return use(ChatContext)
}

export function ChatProvider({ children, chat }: { children: React.ReactNode, chat: Chat<AppUIMessage> }) {
  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>
}
