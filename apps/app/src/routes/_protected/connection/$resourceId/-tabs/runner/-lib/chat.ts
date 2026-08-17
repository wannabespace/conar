import { getRouteApi } from '@tanstack/react-router'

const { useLoaderData } = getRouteApi(
  '/_protected/connection/$resourceId/$tabId'
)

export const useRunnerChat = () => {
  const { chat } = useLoaderData()

  if (!chat) {
    throw new Error('Chat is only available on runner tabs')
  }

  return chat
}
