import type { TOCItemType } from 'fumadocs-core/toc'

const TocList = ({ items }: { items: TOCItemType[] }) => (
  <ul className="flex flex-col gap-1.5">
    {items.map((item) => (
      <li key={item.url} className={item.depth > 2 ? 'pl-3' : undefined}>
        <a
          className="text-muted-foreground hover:text-foreground text-sm"
          href={item.url}
        >
          {item.title}
        </a>
      </li>
    ))}
  </ul>
)

export const Toc = ({
  items,
  variant,
}: {
  items: TOCItemType[]
  variant: 'inline' | 'rail'
}) => {
  if (items.length === 0) {
    return null
  }

  if (variant === 'inline') {
    return (
      <details className="border-border mb-8 border-b pb-4 xl:hidden">
        <summary className="cursor-default text-sm font-medium">
          On this page
        </summary>
        <div className="pt-3">
          <TocList items={items} />
        </div>
      </details>
    )
  }

  return (
    <nav aria-label="On this page" className="flex flex-col gap-3">
      <p className="text-muted-foreground text-xs font-medium">On this page</p>
      <TocList items={items} />
    </nav>
  )
}
