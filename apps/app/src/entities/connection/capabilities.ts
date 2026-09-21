import {
  FlashIcon,
  Key01Icon,
  LeftToRightListDashIcon,
  SecurityCheckIcon,
  SourceCodeIcon,
  TagsIcon,
} from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { uppercaseFirst } from '@tamery/shared/utils/helpers'

import type { ReferentialAction } from './queries/constraints/shape'
import { REFERENTIAL_ACTIONS } from './queries/constraints/shape'
import type { DefinitionsSection } from './store/tabs/types'

export interface SectionCapabilities {
  create?: boolean
  drop?: boolean
  edit?: boolean
}

interface ConnectionCapabilities {
  cascade: boolean
  enumsLabel: string
  explain: boolean
  referentialActions: readonly ReferentialAction[]
  renameColumns: boolean
  renameConstraints: boolean
  schemas: boolean
  sections: Record<DefinitionsSection, SectionCapabilities | false>
  toggleTriggers: boolean
}

const readOnly: SectionCapabilities = {}
const full: SectionCapabilities = { create: true, drop: true, edit: true }

const capabilities: Record<ConnectionType, ConnectionCapabilities> = {
  [ConnectionType.ClickHouse]: {
    cascade: false,
    enumsLabel: 'Enums',
    explain: false,
    referentialActions: REFERENTIAL_ACTIONS,
    renameColumns: false,
    renameConstraints: false,
    schemas: false,
    sections: {
      constraints: readOnly,
      enums: readOnly,
      functions: false,
      indexes: readOnly,
      policies: { drop: true },
      triggers: false,
    },
    toggleTriggers: false,
  },
  [ConnectionType.MSSQL]: {
    cascade: false,
    enumsLabel: 'Enums',
    explain: false,
    referentialActions: REFERENTIAL_ACTIONS.filter(
      (action) => action !== 'RESTRICT'
    ),
    renameColumns: true,
    renameConstraints: true,
    schemas: true,
    sections: {
      constraints: full,
      enums: false,
      functions: full,
      indexes: full,
      policies: readOnly,
      triggers: full,
    },
    toggleTriggers: true,
  },
  [ConnectionType.MySQL]: {
    cascade: false,
    enumsLabel: 'Enums & Sets',
    explain: true,
    // InnoDB parses SET DEFAULT but rejects the table.
    referentialActions: REFERENTIAL_ACTIONS.filter(
      (action) => action !== 'SET DEFAULT'
    ),
    renameColumns: true,
    renameConstraints: false,
    schemas: true,
    sections: {
      constraints: full,
      enums: { edit: true },
      functions: full,
      indexes: full,
      policies: readOnly,
      triggers: full,
    },
    toggleTriggers: false,
  },
  [ConnectionType.Postgres]: {
    cascade: true,
    enumsLabel: 'Enums',
    explain: true,
    referentialActions: REFERENTIAL_ACTIONS,
    renameColumns: true,
    renameConstraints: true,
    schemas: true,
    sections: {
      constraints: full,
      enums: full,
      functions: full,
      indexes: full,
      policies: full,
      triggers: full,
    },
    toggleTriggers: true,
  },
}

const sectionMeta = {
  constraints: { cascade: true, icon: Key01Icon, noun: 'constraint' },
  enums: { cascade: true, icon: TagsIcon, noun: 'enum' },
  functions: { cascade: true, icon: SourceCodeIcon, noun: 'function' },
  indexes: { cascade: false, icon: LeftToRightListDashIcon, noun: 'index' },
  policies: { cascade: false, icon: SecurityCheckIcon, noun: 'policy' },
  triggers: { cascade: false, icon: FlashIcon, noun: 'trigger' },
} as const satisfies Record<
  DefinitionsSection,
  { cascade: boolean; icon: IconSvgElement; noun: string }
>

export type DefinitionsNoun = (typeof sectionMeta)[DefinitionsSection]['noun']

export const capabilitiesOf = (type: ConnectionType) => capabilities[type]

export const sectionMetaOf = (
  section: DefinitionsSection,
  type: ConnectionType
) => ({
  ...sectionMeta[section],
  title:
    section === 'enums'
      ? capabilities[type].enumsLabel
      : uppercaseFirst(section),
})

export const sectionAvailable = (
  section: DefinitionsSection,
  type: ConnectionType
) => capabilities[type].sections[section] !== false

export const sectionCapabilitiesOf = (
  section: DefinitionsSection,
  type: ConnectionType
): SectionCapabilities => capabilities[type].sections[section] || readOnly
