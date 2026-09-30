import { ArrowRight01Icon, PlusSignIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { useParams } from '@tanstack/react-router'

import { parseTabId } from '~/entities/connection/store/tabs/ids'

import { SidebarGroupLabel, SidebarMenuAction } from './primitives'
import type { TreeRow } from './tree-row'

const useActiveTable = () => {
  const { tabId } = useParams({ strict: false })
  const tab = tabId ? parseTabId(tabId) : null

  return tab?.type === 'table' ? tab : null
}

export const SchemaRow = ({
  row,
  onCreateTable,
  onToggle,
}: {
  row: Extract<TreeRow, { kind: 'schema' }>
  onCreateTable: () => void
  onToggle: () => void
}) => {
  const schemaParam = useActiveTable()?.schema

  return (
    <div className="relative h-full">
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
      </SidebarGroupLabel>
      <Tooltip>
        <TooltipTrigger
          render={
            <SidebarMenuAction
              showOnHover
              aria-label={`New table in ${row.name}`}
              className="text-muted-foreground top-1/2! -translate-y-1/2 rounded-md"
              onClick={onCreateTable}
            />
          }
        >
          <HugeiconsIcon
            icon={PlusSignIcon}
            strokeWidth={2}
            className="size-3.5!"
          />
        </TooltipTrigger>
        <TooltipContent side="right">New table</TooltipContent>
      </Tooltip>
    </div>
  )
}
