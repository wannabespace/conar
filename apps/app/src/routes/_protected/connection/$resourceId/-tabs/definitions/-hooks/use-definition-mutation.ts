import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { queryClient } from '~/lib/query-client'

export const useDefinitionMutation = <TVariables = void>({
  mutationFn,
  onSuccess,
  queryKey,
  success,
}: {
  mutationFn: (variables: TVariables) => Promise<unknown>
  onSuccess?: () => void
  queryKey: readonly unknown[]
  success: (variables: TVariables) => string
}) =>
  useMutation({
    mutationFn,
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({ queryKey })
      toast.success(success(variables))
      onSuccess?.()
    },
  })
