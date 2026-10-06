import {
  AppWindowIcon,
  Copy01Icon,
  Delete02Icon,
  PencilEdit01Icon,
  PinIcon,
  PinOffIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { HighlightText } from '@tamery/ui/components/custom/highlight'
import { Indicator } from '@tamery/ui/components/custom/indicator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { copy as copyToClipboard } from '@tamery/ui/lib/copy'
import { cn } from '@tamery/ui/lib/utils'
import { getRouteApi, useParams, useRouter } from '@tanstack/react-router'
import { useSubscription } from 'seitu/react'

import { AppContextMenu, AppMenuButton } from '~/components/app-context-menu'
import type { AppMenuNode } from '~/components/app-menu'
import { Link } from '~/components/link'
import { tableTypeIcon, tableTypeLabel } from '~/core/catalog/table-type'
import { tableSessionStore } from '~/core/table/session'
import { openTab } from '~/core/tabs/actions'
import { tableTabId } from '~/core/tabs/ids'
import { openNewWindow } from '~/lib/new-window'

import { pinnedTable } from './pinned-tables'
import { SidebarMenuAction, SidebarMenuButton } from './primitives'
import {
  RowLevelSecurityMark,
  useRowLevelSecurityItems,
} from './row-level-security'
import type { TreeRow } from './tree-row'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export const TableRow = ({
  row,
  search,
  onRename,
  onDrop,
}: {
  row: Extract<TreeRow, { kind: 'table' }>
  search?: string
  onRename: () => void
  onDrop: () => void
}) => {
  const { connectionResource } = useRouteContext()
  const router = useRouter()
  const tabId = tableTabId(row.schema, row.table.name)
  const isActive = useParams({
    select: (params) => params.tabId === tabId,
    strict: false,
  })
  const isReadOnly = row.table.type !== 'table'
  const Icon = tableTypeIcon[row.table.type]
  const store = tableSessionStore({
    id: connectionResource.id,
    schema: row.schema,
    table: row.table.name,
  })
  const hasDrafts = useSubscription(store, {
    selector: (state) => Object.keys(state.drafts).length > 0,
  })

  const rowLevelSecurityItems = useRowLevelSecurityItems(row)

  const openInNewWindow = () => {
    openTab(connectionResource.id, tableTabId(row.schema, row.table.name))

    openNewWindow(
      router.buildLocation({
        params: { resourceId: connectionResource.id, tabId },
        to: '/connection/$resourceId/$tabId',
      }).href
    )
  }

  const items: AppMenuNode[] = [
    {
      icon: AppWindowIcon,
      label: 'Open in New Window',
      onSelect: openInNewWindow,
    },
    { type: 'separator' },
    {
      icon: Copy01Icon,
      label: 'Copy Name',
      onSelect: () => copyToClipboard(row.table.name, 'Table name copied'),
    },
    {
      icon: row.pinned ? PinOffIcon : PinIcon,
      label: row.pinned ? 'Unpin' : 'Pin',
      onSelect: () =>
        pinnedTable.toggle(connectionResource.id, row.schema, row.table.name),
    },
    { type: 'separator' },
    {
      disabled: isReadOnly,
      icon: PencilEdit01Icon,
      label: 'Rename',
      onSelect: onRename,
    },
    ...rowLevelSecurityItems,
    {
      disabled: isReadOnly,
      icon: Delete02Icon,
      label: 'Drop',
      onSelect: onDrop,
      variant: 'destructive',
    },
  ]

  return (
    <AppContextMenu
      items={items}
      className="block h-full"
      contentProps={{ className: 'min-w-48' }}
    >
      <SidebarMenuButton
        isActive={isActive}
        className={cn(row.pinned && 'pr-12')}
        render={
          <Link
            to="/connection/$resourceId/$tabId"
            params={{
              resourceId: connectionResource.id,
              tabId,
            }}
            preload="intent"
            preloadDelay={200}
            data-mask
            onClick={() =>
              openTab(
                connectionResource.id,
                tableTabId(row.schema, row.table.name),
                true
              )
            }
            onDoubleClick={() =>
              openTab(
                connectionResource.id,
                tableTabId(row.schema, row.table.name)
              )
            }
          />
        }
      >
        <span
          className="relative shrink-0"
          title={tableTypeLabel[row.table.type]}
        >
          <HugeiconsIcon
            icon={Icon}
            strokeWidth={2}
            className={cn(
              'size-4',
              isActive ? 'text-primary-foreground' : 'text-primary/75'
            )}
          />
          {hasDrafts && (
            <Indicator
              className={cn(
                '-top-0.5 -right-0.5 size-1.5',
                // oxlint-disable-next-line shadcn/no-restyle -- the dot inverts on the active primary row
                isActive && 'bg-primary-foreground'
              )}
            />
          )}
        </span>
        <span
          className={cn(
            'flex min-w-0 flex-1 items-center gap-1',
            !row.pinned && 'group-hover/menu-item:row-actions-fade'
          )}
        >
          <span className="truncate">
            <HighlightText text={row.table.name} match={search} />
          </span>
          {row.table.rowLevelSecurity && (
            <RowLevelSecurityMark active={isActive} />
          )}
        </span>
      </SidebarMenuButton>
      <AppMenuButton
        variant="muted"
        items={items}
        contentProps={{ className: 'min-w-48' }}
        render={
          <SidebarMenuAction
            showOnHover
            className={cn(
              isActive &&
                'text-primary-foreground/80! hover:bg-primary-foreground/20 hover:text-primary-foreground!'
            )}
          />
        }
      />
      <Tooltip>
        <TooltipTrigger
          render={
            <SidebarMenuAction
              showOnHover={!row.pinned}
              aria-label={row.pinned ? 'Unpin table' : 'Pin table'}
              className={cn(
                'group/pin right-6',
                isActive && 'hover:bg-primary-foreground/20'
              )}
              onClick={() =>
                pinnedTable.toggle(
                  connectionResource.id,
                  row.schema,
                  row.table.name
                )
              }
            />
          }
        >
          {row.pinned ? (
            <>
              <HugeiconsIcon
                icon={PinIcon}
                strokeWidth={2}
                className={cn(
                  'size-3! group-hover/pin:hidden',
                  isActive ? 'text-primary-foreground' : 'text-primary'
                )}
              />
              <HugeiconsIcon
                icon={PinOffIcon}
                strokeWidth={2}
                className={cn(
                  'hidden size-3! group-hover/pin:block',
                  isActive ? 'text-primary-foreground' : 'text-foreground'
                )}
              />
            </>
          ) : (
            <HugeiconsIcon
              icon={PinIcon}
              strokeWidth={2}
              className={cn(
                'size-3!',
                isActive
                  ? 'text-primary-foreground/80 group-hover/pin:text-primary-foreground'
                  : 'text-muted-foreground group-hover/pin:text-foreground'
              )}
            />
          )}
        </TooltipTrigger>
        <TooltipContent side="right">
          {row.pinned ? 'Unpin' : 'Pin'}
        </TooltipContent>
      </Tooltip>
    </AppContextMenu>
  )
}
