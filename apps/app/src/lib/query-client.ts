import { keepPreviousData, QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      placeholderData: keepPreviousData,
      retry: 0,
      staleTime: Number.POSITIVE_INFINITY,
      throwOnError: true,
    },
  },
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
