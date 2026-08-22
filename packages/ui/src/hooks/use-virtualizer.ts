import type {
  PartialKeys,
  ReactVirtualizerOptions,
} from '@tanstack/react-virtual'
import { useVirtualizer as useTanstackVirtualizer } from '@tanstack/react-virtual'

export const useVirtualizer = <
  TScrollElement extends Element,
  TItemElement extends Element,
>(
  options: PartialKeys<
    ReactVirtualizerOptions<TScrollElement, TItemElement>,
    'observeElementRect' | 'observeElementOffset' | 'scrollToFn'
  >
) => {
  'use no memo'

  // oxlint-disable-next-line react/incompatible-library
  const virtualizer = useTanstackVirtualizer(options)

  return {
    measure: virtualizer.measure,
    scrollToIndex: virtualizer.scrollToIndex,
    totalSize: virtualizer.getTotalSize(),
    virtualItems: virtualizer.getVirtualItems(),
  }
}
