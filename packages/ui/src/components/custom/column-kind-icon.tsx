import {
  BinaryCodeIcon,
  BracesIcon,
  Calendar03Icon,
  CheckmarkSquare02Icon,
  Clock01Icon,
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
import type { ColumnKind } from '@tamery/shared/column-kind'
import { cn } from '@tamery/ui/lib/utils'

const COLUMN_KIND_ICONS: Record<ColumnKind, IconSvgElement> = {
  binary: BinaryCodeIcon,
  boolean: CheckmarkSquare02Icon,
  date: Calendar03Icon,
  json: BracesIcon,
  key: Key01Icon,
  link: Link01Icon,
  list: LeftToRightListBulletIcon,
  number: HashtagIcon,
  select: Tag01Icon,
  text: TextIcon,
  time: Clock01Icon,
  uuid: FingerPrintIcon,
}

export const ColumnKindIcon = ({
  kind,
  label,
}: {
  kind: ColumnKind
  label?: string
}) => (
  <HugeiconsIcon
    icon={COLUMN_KIND_ICONS[kind]}
    strokeWidth={2}
    aria-label={label}
    className={cn(
      'size-3.5 shrink-0',
      kind === 'key' ? 'text-primary' : 'text-muted-foreground'
    )}
  />
)
