import {
  ArrowDown02Icon,
  ArrowUpRight01Icon,
  Calendar03Icon,
  HashtagIcon,
  Key01Icon,
  Link01Icon,
  MoreHorizontalIcon,
  Tag01Icon,
  TextIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Badge } from '@tamery/ui/components/badge'
import { Button } from '@tamery/ui/components/button'
import { Checkbox } from '@tamery/ui/components/checkbox'
import { Separator } from '@tamery/ui/components/separator'
import { cn } from '@tamery/ui/lib/utils'

const COLUMNS = [
  { icon: Key01Icon, id: 'id', width: 'w-20' },
  { icon: Link01Icon, id: 'user_id', width: 'w-28' },
  { icon: TextIcon, id: 'customer', width: 'w-36' },
  { icon: HashtagIcon, id: 'total', sorted: true, width: 'w-28' },
  { icon: Tag01Icon, id: 'status', width: 'w-28' },
  { icon: Calendar03Icon, id: 'created_at', width: 'w-40' },
]

const STATUS_DOTS: Record<string, string> = {
  paid: 'bg-success',
  pending: 'bg-warning',
  refunded: 'bg-destructive',
}

const ROWS = [
  ['58340', '1176', 'Priya Raman', '$608.94', 'paid', '2026-09-30 15:51'],
  ['58307', '1179', 'Tomás Ferreira', '$608.65', 'paid', '2026-09-14 12:54'],
  ['58309', '1157', 'Daniel Okafor', '$605.91', 'pending', '2026-09-15 08:58'],
  ['58338', '1150', 'Anna Kowalska', '$602.30', 'refunded', '2026-09-29 18:44'],
  ['58305', '1153', 'Mateo Álvarez', '$600.36', 'paid', '2026-09-13 16:49'],
  ['58311', '1135', 'Kenji Mori', '$592.24', 'paid', '2026-09-16 04:59'],
  ['58336', '1172', 'Hana Kobayashi', '$584.86', 'paid', '2026-09-28 20:36'],
  [
    '58303',
    '1175',
    'Oskar Lindqvist',
    '$581.35',
    'pending',
    '2026-09-12 19:42',
  ],
  ['58313', '1161', 'Jonas Weber', '$568.14', 'paid', '2026-09-17 00:59'],
  ['58334', '1146', 'Aiko Tanaka', '$557.27', 'pending', '2026-09-27 22:27'],
  ['58301', '1149', 'Felix Braun', '$552.32', 'paid', '2026-09-11 21:34'],
  ['58315', '1139', 'Lukas Schmidt', '$534.51', 'paid', '2026-09-18 04:57'],
  ['58331', '1166', 'Sofia Rossi', '$521.08', 'paid', '2026-09-26 10:12'],
  ['58328', '1144', 'Léa Martin', '$498.70', 'pending', '2026-09-24 23:04'],
] as const

const SELECTED_ROWS = new Set(['58309', '58305'])
const EDITED_ROW = '58338'

const cellClassName =
  'flex h-full shrink-0 items-center gap-1 border-r px-2 text-xs'

export const Grid = () => (
  <div className="relative min-h-0 flex-1 overflow-hidden border-t">
    <div className="flex h-8 border-b">
      <div className="flex w-10 shrink-0 items-center justify-center border-r">
        <Checkbox />
      </div>
      {COLUMNS.map((column) => (
        <div
          key={column.id}
          className={cn(
            'flex h-full shrink-0 items-center gap-1.5 border-r py-1 pr-1 pl-2',
            column.width
          )}
        >
          <HugeiconsIcon
            icon={column.icon}
            strokeWidth={2}
            className={cn(
              'size-3.5 shrink-0',
              column.id === 'id' ? 'text-primary' : 'text-muted-foreground'
            )}
          />
          <span className="min-w-0 flex-1 truncate text-xs font-medium">
            {column.id}
          </span>
          {column.sorted && (
            <HugeiconsIcon
              icon={ArrowDown02Icon}
              strokeWidth={2}
              className="text-primary size-3 shrink-0"
            />
          )}
          <Button variant="ghost-muted" size="icon-xs">
            <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
          </Button>
        </div>
      ))}
    </div>
    {ROWS.map(([id, user, customer, total, status, created]) => (
      <div key={id} className="flex h-8 border-b">
        <div className="flex w-10 shrink-0 items-center justify-center border-r">
          <Checkbox checked={SELECTED_ROWS.has(id)} />
        </div>
        <div className={cn(cellClassName, 'w-20 tabular-nums')}>{id}</div>
        <div className={cn(cellClassName, 'w-28 tabular-nums')}>
          {user}
          <Button variant="ghost-row" size="icon-2xs" className="ml-auto">
            <HugeiconsIcon
              icon={ArrowUpRight01Icon}
              strokeWidth={2}
              className="text-muted-foreground size-3"
            />
          </Button>
        </div>
        <div className={cn(cellClassName, 'w-36')}>{customer}</div>
        <div className={cn(cellClassName, 'w-28 tabular-nums')}>{total}</div>
        <div
          className={cn(
            cellClassName,
            'w-28',
            id === EDITED_ROW && 'bg-warning/15'
          )}
        >
          <Badge variant="secondary">
            <span
              className={cn('size-1.5 rounded-full', STATUS_DOTS[status])}
            />
            {status}
          </Badge>
        </div>
        <div className={cn(cellClassName, 'w-40 tabular-nums')}>{created}</div>
      </div>
    ))}
    <div className="absolute inset-x-0 bottom-4 flex justify-center">
      <div className="bg-popover/70 ring-foreground/4 flex items-center gap-1 rounded-xl p-1 shadow-lg ring backdrop-blur">
        <Button variant="destructive" size="sm">
          Delete (2)
        </Button>
        <Separator orientation="vertical" className="mx-0.5 h-4!" />
        <Button variant="ghost-muted" size="sm">
          Review
        </Button>
        <Button size="sm">Save (1)</Button>
      </div>
    </div>
  </div>
)
