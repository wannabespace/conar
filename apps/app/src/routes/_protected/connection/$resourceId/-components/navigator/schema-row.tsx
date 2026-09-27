import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { cn } from '@tamery/ui/lib/utils'
import { useParams } from '@tanstack/react-router'

import { parseTabId } from '~/entities/connection/store/tabs/ids'

import { SidebarGroupLabel } from './primitives'
import type { TreeRow } from './tree-row'

const useActiveTable = () => {
  const { tabId } = useParams({ strict: false })
  const tab = tabId ? parseTabId(tabId) : null

  return tab?.type === 'table' ? tab : null
}

export const SchemaRow = ({
  row,
  onToggle,
}: {
  row: Extract<TreeRow, { kind: 'schema' }>
  onToggle: () => void
}) => {
  const schemaParam = useActiveTable()?.schema

  return (
    <SidebarGroupLabel
      render={
        <button
          type="button"
          aria-label={`Toggle ${row.name} schema`}
          onClick={onToggle}
        />
      }
      className="group hover:bg-foreground/5 h-full w-full gap-1 px-1.5"
    >
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        strokeWidth={2}
        className={cn(
          `text-muted-foreground/70 size-3.5! shrink-0 transition-transform duration-150 ease-out`,
          row.open && 'rotate-90'
        )}
      />
      <span
        className={cn(
          'text-2xs truncate font-semibold tracking-wider uppercase',
          schemaParam === row.name && 'text-foreground'
        )}
      >
        {row.name}
      </span>
      <span className="text-2xs text-muted-foreground/50 ml-auto pr-1 tabular-nums opacity-0 group-hover:opacity-100">
        {row.tablesCount}
      </span>
    </SidebarGroupLabel>
  )
}
