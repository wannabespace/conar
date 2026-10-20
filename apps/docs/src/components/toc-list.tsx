import type { TOCItemType } from 'fumadocs-core/toc'

export const TocList = ({ items }: { items: TOCItemType[] }) => (
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
