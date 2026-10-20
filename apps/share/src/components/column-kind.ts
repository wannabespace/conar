import {
  BracesIcon,
  Calendar03Icon,
  CheckmarkSquare02Icon,
  Clock01Icon,
  FingerPrintIcon,
  HashtagIcon,
  LeftToRightListBulletIcon,
  TextIcon,
} from '@hugeicons/core-free-icons'

// The same glyphs the app's column headers use, read off the engine's type name alone.
const KINDS = [
  {
    icon: CheckmarkSquare02Icon,
    kind: 'boolean',
    type: /^(?:bool|boolean|bit)$/iu,
  },
  {
    icon: BracesIcon,
    kind: 'json',
    type: /json|xml|\b(?:map|tuple|nested)\(/iu,
  },
  { icon: FingerPrintIcon, kind: 'uuid', type: /uuid|uniqueidentifier/iu },
  { icon: LeftToRightListBulletIcon, kind: 'list', type: /\[\]$|^array\(/iu },
  { icon: Calendar03Icon, kind: 'date', type: /date|timestamp/iu },
  { icon: Clock01Icon, kind: 'time', type: /^time/iu },
  {
    icon: HashtagIcon,
    kind: 'number',
    type: /int|numeric|decimal|float|double|real|money|serial|number/iu,
  },
] as const

const TEXT = { icon: TextIcon, kind: 'text' } as const

export const getColumnKind = (type: string) =>
  KINDS.find((entry) => entry.type.test(type)) ?? TEXT
