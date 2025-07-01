import { queryOptions } from '@tanstack/react-query'
import { trpc } from '~/lib/trpc'
import { createCache } from '~/utils/cache'

const usersCountKey = 'USERS_COUNT'

const usersCountCache = createCache<number>({
  key: usersCountKey,
  hours: 3,
})

export const getUsersCountOptions = queryOptions({
  queryKey: ['users', 'count'],
  queryFn: async () => {
    const cached = usersCountCache.get()
    if (cached)
      return cached

    const usersCount = await trpc.users.count.query()
    usersCountCache.set(usersCount)
    return usersCount
  },
})
