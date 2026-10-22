import type { AnimationPlaybackControls } from 'motion/react'
import { animate } from 'motion/react'

const glides = new WeakMap<Element, AnimationPlaybackControls>()

export const glideIntoView = (scroller: HTMLElement, element: Element) => {
  glides.get(scroller)?.stop()
  const { scrollLeft, scrollTop } = scroller
  // The instant jump measures the target with the header's scroll-margin and the pinned column's scroll-padding applied; the glide then replays it from the start.
  element.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  const left = scroller.scrollLeft - scrollLeft
  const top = scroller.scrollTop - scrollTop
  if (
    (!left && !top) ||
    matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return
  }
  scroller.scrollTo(scrollLeft, scrollTop)
  glides.set(
    scroller,
    animate(0, 1, {
      duration: 0.12,
      ease: [0.32, 0.72, 0, 1],
      onUpdate: (progress) =>
        scroller.scrollTo(
          scrollLeft + left * progress,
          scrollTop + top * progress
        ),
    })
  )
}
