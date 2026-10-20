import { ArrowDown01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@tamery/ui/components/popover'
import { cn } from '@tamery/ui/lib/utils'
import { TOCItem, useActiveAnchor } from 'fumadocs-core/toc'
import type { TOCItemType } from 'fumadocs-core/toc'
import { useState } from 'react'

const TocList = ({
  items,
  onNavigate,
}: {
  items: TOCItemType[]
  onNavigate?: () => void
}) => (
  <ul className="border-foreground/8 flex flex-col border-l text-sm">
    {items.map((item) => (
      <li key={item.url} className="flex">
        <TOCItem
          className={cn(
            'text-muted-foreground hover:text-foreground data-[active=true]:border-foreground data-[active=true]:text-foreground -ml-px cursor-default border-l border-transparent py-1 pr-2 transition-colors',
            item.depth > 2 ? 'pl-6' : 'pl-3'
          )}
          href={item.url}
          onClick={onNavigate}
        >
          {item.title}
        </TOCItem>
      </li>
    ))}
  </ul>
)

export const TocRail = ({ items }: { items: TOCItemType[] }) => (
  <nav
    aria-label="On this page"
    className="sticky top-14 flex max-h-[calc(100dvh-3.5rem)] flex-col gap-3 overflow-y-auto py-10"
  >
    <p className="text-xs font-medium">On this page</p>
    <TocList items={items} />
  </nav>
)

export const TocBar = ({ items }: { items: TOCItemType[] }) => {
  const [open, setOpen] = useState(false)
  const activeId = useActiveAnchor()
  const active = items.find((item) => item.url === `#${activeId}`)

  return (
    <div className="bg-background/80 border-foreground/6 sticky top-14 z-10 flex h-11 items-center rounded-t-2xl border-b px-2 backdrop-blur-xl @4xl:hidden">
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger
          render={
            <Button className="min-w-0" size="sm" variant="ghost-muted" />
          }
        >
          <span className="shrink-0">On this page</span>
          {active && (
            <span className="text-foreground truncate">{active.title}</span>
          )}
          <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
        </PopoverTrigger>
        <PopoverContent align="start" className="max-w-80 overflow-y-auto">
          <TocList items={items} onNavigate={() => setOpen(false)} />
        </PopoverContent>
      </Popover>
    </div>
  )
}
