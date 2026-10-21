import {
  keepPreviousData,
  MutationCache,
  QueryClient,
} from '@tanstack/react-query'

import { posthog } from './posthog'

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: { event?: string }
  }
}

export const API_QUERY_KEY = 'api'

export const queryClient = new QueryClient({
  defaultOptions: {
    mutations: { networkMode: 'always' },
    queries: {
      networkMode: 'always',
      placeholderData: keepPreviousData,
      retry: 0,
      staleTime: Number.POSITIVE_INFINITY,
      throwOnError: true,
    },
  },
  mutationCache: new MutationCache({
    onSettled: (_data, error, _variables, _context, mutation) => {
      if (mutation.meta?.event) {
        posthog.capture(mutation.meta.event, { success: !error })
      }
    },
  }),
})

queryClient.setQueryDefaults([API_QUERY_KEY], {
  networkMode: 'online',
  staleTime: 0,
  throwOnError: false,
})
