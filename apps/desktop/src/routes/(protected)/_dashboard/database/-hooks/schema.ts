import { useLocalStorageValue } from '@react-hookz/web'

export function useDatabaseSchema(id: string) {
  const { value, set } = useLocalStorageValue(`database-schema-${id}`, {
    defaultValue: 'public',
    initializeWithValue: true,
  })
  return [value, set] as const
}
