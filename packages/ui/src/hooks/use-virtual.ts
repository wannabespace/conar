import { useVirtualizer } from '@tanstack/react-virtual'

// https://github.com/TanStack/virtual/issues/736
export function useVirtual(options: Parameters<typeof useVirtualizer>[0]) {
  'use no memo'

  const { getVirtualItems, getTotalSize } = useVirtualizer(options)

  return { virtualItems: getVirtualItems(), totalSize: getTotalSize() }
}
