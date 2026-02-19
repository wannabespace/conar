import type { RefObject } from 'react'
import { useEffect, useState } from 'react'

const SCROLL_TOP_OFFSET = 4

export function useActiveSchema(
  scrollContainerRef: RefObject<HTMLDivElement | null>,
  expandedSchemaIds: string[],
) {
  const [activeSchemaId, setActiveSchemaId] = useState<string | null>(null)

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer)
      return

    const handleScroll = () => {
      const containerTop = scrollContainer.getBoundingClientRect().top
      const schemaTriggers = scrollContainer.querySelectorAll<HTMLElement>('[data-schema-trigger]')

      const activeId = Array.from(schemaTriggers).reduce<string | null>(
        (passed, trigger) =>
          trigger.getBoundingClientRect().top < containerTop + SCROLL_TOP_OFFSET
            ? trigger.getAttribute('data-schema-trigger')
            : passed,
        null,
      )

      setActiveSchemaId(activeId)
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [scrollContainerRef])

  return {
    activeSchemaId,
    isActiveSchemaExpanded: activeSchemaId !== null && expandedSchemaIds.includes(activeSchemaId),
  } as const
}
