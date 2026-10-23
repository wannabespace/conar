import { useEffect, useState } from 'react'

export const TableOfContents = () => {
  const [items, setItems] = useState<{ id: string; text: string }[]>([])
  const [active, setActive] = useState('')

  useEffect(() => {
    const headings = [
      ...document.querySelectorAll<HTMLHeadingElement>('article h2[id]'),
    ]
    // oxlint-disable-next-line react/set-state-in-effect -- headings live only in the DOM the MDX article renders after mount
    setItems(
      headings.map((heading) => ({
        id: heading.id,
        text: heading.textContent ?? '',
      }))
    )

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id)
          }
        }
      },
      { rootMargin: '0px 0px -75% 0px' }
    )
    for (const heading of headings) {
      observer.observe(heading)
    }
    return () => observer.disconnect()
  }, [])

  if (items.length === 0) {
    return null
  }

  return (
    <nav aria-label="On this page" className="flex flex-col gap-2 text-sm">
      <span className="text-muted-foreground text-2xs font-medium tracking-wide uppercase">
        On this page
      </span>
      {items.map((item) => (
        <a
          className="data-active:text-foreground text-muted-foreground hover:text-foreground ease-house text-pretty transition-colors"
          data-active={item.id === active || undefined}
          href={`#${item.id}`}
          key={item.id}
        >
          {item.text}
        </a>
      ))}
    </nav>
  )
}
