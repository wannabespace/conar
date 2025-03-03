import { useLocalStorageValue } from '@react-hookz/web'

export function useOpenTabs(id: string) {
  const { value: openTabs, set: setOpenTabs } = useLocalStorageValue(`connection-${id}-open-tabs`, {
    defaultValue: [] as { id: string, label: string }[],
  })

  return {
    openTabs: openTabs ?? [],
    setOpenTabs,
  }
}
