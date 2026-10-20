import { skeletonBarWidth } from '@tamery/table'
import { Skeleton } from '@tamery/ui/components/skeleton'
import { cn } from '@tamery/ui/lib/utils'
import type { CSSProperties } from 'react'

import {
  DOCUMENT_HEADER_CLASS,
  DOCUMENT_ITEM_CLASS,
  FIELD_ROW_CLASS,
} from '~/core/table/document-list'

const DOCUMENTS = 4
const FIELDS = 6

export const DocumentsSkeleton = ({ selectable }: { selectable: boolean }) => (
  <div aria-hidden className="size-full overflow-hidden">
    {Array.from({ length: DOCUMENTS }, (_, document) => (
      <div key={document} data-index={document} className={DOCUMENT_ITEM_CLASS}>
        <div className={DOCUMENT_HEADER_CLASS}>
          {selectable && <Skeleton className="mr-2 -ml-1 size-4" />}
          <Skeleton className="h-2.5 w-12" />
        </div>
        {Array.from({ length: FIELDS }, (__, field) => (
          <div
            key={field}
            className={cn(
              'flex h-8 items-center gap-4',
              FIELD_ROW_CLASS,
              'px-4'
            )}
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton
              className="h-3.5 w-(--bar-width)"
              style={
                {
                  '--bar-width': skeletonBarWidth(document, field),
                } as CSSProperties
              }
            />
          </div>
        ))}
      </div>
    ))}
  </div>
)
