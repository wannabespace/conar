import type { Database } from '~/lib/indexeddb'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { updateDatabasePassword } from '../lib'

export function useUpdateDatabasePassword(database: Database) {
  return useMutation({
    mutationFn: async (password: string) => {
      await updateDatabasePassword(database.id, password)
    },
    onSuccess: () => {
      toast.success('Password successfully saved!')
    },
  })
}

export function useTestDatabase() {
  return useMutation({
    mutationFn: window.electron.databases.test,
    onError: (error) => {
      toast.error(error.message)
    },
    onSuccess: () => {
      toast.success('Connection successful. You can now save the database.')
    },
  })
}
