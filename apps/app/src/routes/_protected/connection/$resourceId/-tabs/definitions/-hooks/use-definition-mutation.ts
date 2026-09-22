import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { queryClient } from '~/lib/query-client'

// Owns what every definition write does afterwards: refresh the list, say so,
// and close the inspector it was saved from.
export const useDefinitionMutation = <TInput>({
  message,
  onOpenChange,
  queryKey,
  save,
}: {
  message: (input: TInput) => string
  onOpenChange?: (open: boolean) => void
  queryKey: readonly unknown[]
  save: (input: TInput) => Promise<unknown>
}) =>
  useMutation({
    mutationFn: save,
    onSuccess: async (_result, input) => {
      await queryClient.invalidateQueries({ queryKey })
      toast.success(message(input))
      onOpenChange?.(false)
    },
  })
