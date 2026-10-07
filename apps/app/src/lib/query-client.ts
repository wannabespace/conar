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

// A query calling the Tamery API must set networkMode: 'online' (architecture.md).
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

export const subscriptionQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      placeholderData: keepPreviousData,
      refetchOnWindowFocus: 'always',
      retry: 0,
    },
  },
})
