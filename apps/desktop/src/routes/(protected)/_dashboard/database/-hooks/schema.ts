import { useLocalStorageValue } from '@react-hookz/web'

const DATABASES_SCHEMAS_KEY = 'databases-schemas'

export function getDatabaseSchema(id: string) {
  const value = localStorage.getItem(DATABASES_SCHEMAS_KEY)

  if (!value)
    return 'public'

  const schemas = JSON.parse(value) as Record<string, string>

  return schemas[id] ?? 'public'
}

export function useDatabaseSchema(id: string) {
  const { value, set } = useLocalStorageValue(DATABASES_SCHEMAS_KEY, {
    defaultValue: {} as Record<string, string>,
    initializeWithValue: true,
  })

  function setSchema(schema: string) {
    set(prev => ({ ...prev, [id]: schema }))
  }

  return [value[id] ?? 'public', setSchema] as const
}
