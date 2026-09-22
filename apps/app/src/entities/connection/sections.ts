import {
  FlashIcon,
  Key01Icon,
  LeftToRightListDashIcon,
  LockKeyIcon,
  SecurityCheckIcon,
  SourceCodeIcon,
  TagsIcon,
} from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import { uppercaseFirst } from '@tamery/shared/utils'

import type { DefinitionsSection } from './store/tabs/types'

const sectionMeta = {
  constraints: { cascade: true, icon: Key01Icon, noun: 'constraint' },
  enums: { cascade: true, icon: TagsIcon, noun: 'enum' },
  functions: { cascade: true, icon: SourceCodeIcon, noun: 'function' },
  indexes: { cascade: false, icon: LeftToRightListDashIcon, noun: 'index' },
  policies: { cascade: false, icon: SecurityCheckIcon, noun: 'policy' },
  privileges: { cascade: false, icon: LockKeyIcon, noun: 'privilege' },
  triggers: { cascade: false, icon: FlashIcon, noun: 'trigger' },
} as const satisfies Record<
  DefinitionsSection,
  { cascade: boolean; icon: IconSvgElement; noun: string }
>

export const sectionMetaOf = (section: DefinitionsSection) => ({
  ...sectionMeta[section],
  title: uppercaseFirst(section),
})
