import { TableSkeleton } from '@tamery/table'
import { Skeleton } from '@tamery/ui/components/skeleton'

import { TopBar } from './top-bar'

export const SHARE_PAGE_CLASS =
  'mx-auto flex h-dvh w-full max-w-5xl flex-col gap-6 px-4 pt-4 pb-10 sm:px-6'
export const SHARE_HEADER_CLASS = 'flex shrink-0 flex-col gap-2 px-4'
export const SHARE_TABLE_CLASS =
  'bg-background ring-foreground/4 relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl ring'

export const ShareSkeleton = () => (
  <div className={SHARE_PAGE_CLASS}>
    <TopBar />
    <header className={SHARE_HEADER_CLASS}>
      <Skeleton className="my-1 h-7 w-56" />
      <Skeleton className="h-3 w-36" />
    </header>
    <main className={SHARE_TABLE_CLASS}>
      <TableSkeleton selectable={false} />
    </main>
  </div>
)
