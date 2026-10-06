import {
  BinaryCodeIcon,
  BracesIcon,
  Calendar03Icon,
  CheckmarkSquare02Icon,
  Clock01Icon,
  EraserIcon,
  FingerPrintIcon,
  HashtagIcon,
  Key01Icon,
  LeftToRightListBulletIcon,
  Link01Icon,
  Tag01Icon,
  TextIcon,
} from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'

import type { Column } from '~/core/table/cell/utils'
import { isNumericColumn } from '~/core/table/cell/utils'

const columnClauses = (column: Column) =>
  [
    column.typeLabel && ['TYPE', column.typeLabel],
    column.primaryKey ? ['PRIMARY KEY'] : column.unique && ['UNIQUE'],
    column.foreign && [
      'REFERENCES',
      `${column.foreign.table}(${column.foreign.column})`,
    ],
    [column.isNullable ? 'NULLABLE' : 'NOT NULL'],
    column.defaultValue && ['DEFAULT', column.defaultValue],
    column.availableValues && [
      'ENUM',
      `(${column.availableValues.map((value) => `'${value}'`).join(', ')})`,
    ],
  ].filter((clause) => Array.isArray(clause))

const UI_TYPE_ICONS: Partial<Record<Column['uiType'], IconSvgElement>> = {
  boolean: CheckmarkSquare02Icon,
  date: Calendar03Icon,
  datetime: Calendar03Icon,
  list: LeftToRightListBulletIcon,
  select: Tag01Icon,
  time: Clock01Icon,
}

const columnIcon = (column: Column) => {
  if (column.primaryKey) {
    return Key01Icon
  }
  if (column.foreign) {
    return Link01Icon
  }
  const uiTypeIcon = UI_TYPE_ICONS[column.uiType]
  if (uiTypeIcon) {
    return uiTypeIcon
  }
  if (isNumericColumn(column)) {
    return HashtagIcon
  }
  const type = column.type?.toLowerCase() ?? ''
  if (type.includes('json') || type.includes('xml')) {
    return BracesIcon
  }
  if (type.includes('uuid') || type.includes('uniqueidentifier')) {
    return FingerPrintIcon
  }
  if (/blob|binary|bytea/u.test(type)) {
    return BinaryCodeIcon
  }
  return TextIcon
}

const ColumnClauses = ({ column }: { column: Column }) => (
  <TooltipContent side="bottom" className="max-w-sm">
    <div className="text-2xs flex flex-col font-mono leading-4">
      {columnClauses(column).map(([keyword, value]) => (
        <span key={keyword}>
          <span className="opacity-60">{keyword}</span>
          {value && <span data-mask> {value}</span>}
        </span>
      ))}
    </div>
  </TooltipContent>
)

export const ColumnHeading = ({ column }: { column: Column }) => (
  <Tooltip>
    <TooltipTrigger
      render={<div className="flex min-w-0 items-center gap-1.5" />}
    >
      <HugeiconsIcon
        icon={columnIcon(column)}
        strokeWidth={2}
        aria-label={column.typeLabel}
        className={cn(
          'size-3.5 shrink-0',
          column.primaryKey ? 'text-primary' : 'text-muted-foreground'
        )}
      />
      <span data-mask className="truncate text-xs font-medium">
        {column.id}
      </span>
    </TooltipTrigger>
    <ColumnClauses column={column} />
  </Tooltip>
)

export const ColumnType = ({ column }: { column: Column }) => (
  <Tooltip>
    <TooltipTrigger
      render={
        <div className="text-muted-foreground text-2xs flex w-fit max-w-full items-center gap-1 leading-4" />
      }
    >
      {column.primaryKey && (
        <HugeiconsIcon
          icon={Key01Icon}
          strokeWidth={2}
          className="text-primary size-2.5 shrink-0"
        />
      )}
      {column.foreign && (
        <HugeiconsIcon
          icon={Link01Icon}
          strokeWidth={2}
          className="size-2.5 shrink-0"
        />
      )}
      {column.isNullable && (
        <HugeiconsIcon
          icon={EraserIcon}
          strokeWidth={2}
          className="size-2.5 shrink-0 opacity-70"
        />
      )}
      <span data-mask className="truncate">
        {column.typeLabel}
      </span>
    </TooltipTrigger>
    <ColumnClauses column={column} />
  </Tooltip>
)
