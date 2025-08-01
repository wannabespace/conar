import type { databases } from '~/drizzle'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryClient } from '~/main'
import { updateDatabasePassword } from '../lib'
import { databaseQuery } from '../queries/database'

export function useUpdateDatabasePassword(database: typeof databases.$inferSelect) {
  return useMutation({
    mutationFn: async (password: string) => {
      await updateDatabasePassword(database.id, password)
      await queryClient.resetQueries({ queryKey: databaseQuery(database.id).queryKey })
    },
    onSuccess: () => {
      toast.success('Password successfully saved!')
    },
  })
}
