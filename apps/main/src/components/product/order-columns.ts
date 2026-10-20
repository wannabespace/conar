import {
  Calendar03Icon,
  HashtagIcon,
  Key01Icon,
  Link01Icon,
  Tag01Icon,
  TextIcon,
} from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'

import type { Order } from './orders'

export interface OrderColumn {
  icon: IconSvgElement
  id: keyof Order
  numeric?: boolean
  sorted?: boolean
  width: string
}

export const ORDER_COLUMNS: OrderColumn[] = [
  { icon: Key01Icon, id: 'id', numeric: true, width: 'w-20' },
  { icon: Link01Icon, id: 'user_id', numeric: true, width: 'w-28' },
  { icon: TextIcon, id: 'customer', width: 'w-36' },
  {
    icon: HashtagIcon,
    id: 'total',
    numeric: true,
    sorted: true,
    width: 'w-28',
  },
  { icon: Tag01Icon, id: 'status', width: 'w-28' },
  { icon: Calendar03Icon, id: 'created_at', numeric: true, width: 'w-40' },
]

export const orderCellClass =
  'flex h-full shrink-0 items-center gap-1 border-r px-2 text-xs'
