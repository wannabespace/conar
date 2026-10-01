import {
  createChatsCollection,
  createChatsMessagesCollection,
  createChatsMessagesPartsCollection,
} from './sync'

declare module '~/core/collections' {
  interface Collections {
    chatsCollection: ReturnType<typeof createChatsCollection>
    chatsMessagesCollection: ReturnType<typeof createChatsMessagesCollection>
    chatsMessagesPartsCollection: ReturnType<
      typeof createChatsMessagesPartsCollection
    >
  }
}

const chatCollections = () => ({
  chatsCollection: createChatsCollection(),
  chatsMessagesCollection: createChatsMessagesCollection(),
  chatsMessagesPartsCollection: createChatsMessagesPartsCollection(),
})

export default chatCollections
