import { useVirtualizer } from '@tanstack/react-virtual'

// https://github.com/TanStack/virtual/issues/736
export function useVirtual(...params: Parameters<typeof useVirtualizer>) {
  'use no memo'

  const { getVirtualItems, getTotalSize } = useVirtualizer(...params)

  return { virtualItems: getVirtualItems(), totalSize: getTotalSize() }
}
