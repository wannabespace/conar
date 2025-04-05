import type { Database } from '~/lib/indexeddb'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryClient } from '~/main'
import { updateDatabasePassword } from '../lib'
import { databaseQuery } from '../queries/database'

export function useUpdateDatabasePassword(database: Database) {
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

export function useTestDatabase() {
  return useMutation({
    mutationFn: window.electron.databases.test,
    onSuccess: () => {
      toast.success('Connection successful. You can now save the database.')
    },
  })
}
