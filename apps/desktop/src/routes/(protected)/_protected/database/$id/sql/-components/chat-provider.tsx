import type { Chat } from '@ai-sdk/react'
import type { chatMessages } from '../-chat'
import { createContext, use } from 'react'

type ChatMessage = Awaited<ReturnType<typeof chatMessages.get>>[number]

export const ChatContext = createContext<Chat<Awaited<ReturnType<typeof chatMessages.get>>[number]>>(null!)

export function useChatContext() {
  return use(ChatContext)
}

export function ChatProvider({ children, chat }: { children: React.ReactNode, chat: Chat<ChatMessage> }) {
  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>
}
