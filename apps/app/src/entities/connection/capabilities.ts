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
import { uppercaseFirst } from '@tamery/shared/utils'

import type { ReferentialAction } from './queries/constraints/shape'
import { REFERENTIAL_ACTIONS } from './queries/constraints/shape'
import {
  FUNCTION_DETERMINISM,
  FUNCTION_VOLATILITIES,
} from './queries/functions/shape'
import type {
  TriggerEvent,
  TriggerOrientation,
  TriggerTiming,
} from './queries/triggers/shape'
import {
  TRIGGER_EVENTS,
  TRIGGER_ORIENTATIONS,
  TRIGGER_TIMINGS,
} from './queries/triggers/shape'
import type { DefinitionsSection } from './store/tabs/types'

export interface SectionCapabilities {
  create?: boolean
  drop?: boolean
  edit?: boolean
}

interface FunctionCapabilities {
  behaviors: readonly string[]
  languages: readonly string[]
  securityDefiner: boolean
}

interface TriggerCapabilities {
  body: boolean
  events: readonly TriggerEvent[]
  multipleEvents: boolean
  orientations: readonly TriggerOrientation[]
  timings: readonly TriggerTiming[]
  toggle: boolean
}

interface ConnectionCapabilities {
  cascade: boolean
  enumsLabel: string
  explain: boolean
  functions: FunctionCapabilities
  referentialActions: readonly ReferentialAction[]
  renameColumns: boolean
  rowLevelSecurity: boolean
  renameConstraints: boolean
  schemas: boolean
  sections: Record<DefinitionsSection, SectionCapabilities | false>
  triggers: TriggerCapabilities
}

// Only Postgres fires a trigger on TRUNCATE, and only per statement.
const ROW_EVENTS = TRIGGER_EVENTS.filter((event) => event !== 'TRUNCATE')

const readOnly: SectionCapabilities = {}
const full: SectionCapabilities = { create: true, drop: true, edit: true }

const capabilities: Record<ConnectionType, ConnectionCapabilities> = {
  [ConnectionType.ClickHouse]: {
    cascade: false,
    enumsLabel: 'Enums',
    explain: false,
    functions: { behaviors: [], languages: [], securityDefiner: false },
    referentialActions: REFERENTIAL_ACTIONS,
    renameColumns: false,
    renameConstraints: false,
    rowLevelSecurity: false,
    schemas: false,
    sections: {
      constraints: readOnly,
      enums: readOnly,
      functions: false,
      indexes: readOnly,
      policies: { drop: true },
      triggers: false,
    },
    triggers: {
      body: false,
      events: [],
      multipleEvents: false,
      orientations: [],
      timings: [],
      toggle: false,
    },
  },
  [ConnectionType.MSSQL]: {
    cascade: false,
    enumsLabel: 'Enums',
    explain: false,
    functions: { behaviors: [], languages: [], securityDefiner: false },
    referentialActions: REFERENTIAL_ACTIONS.filter(
      (action) => action !== 'RESTRICT'
    ),
    renameColumns: true,
    renameConstraints: true,
    rowLevelSecurity: false,
    schemas: true,
    sections: {
      constraints: full,
      enums: false,
      functions: full,
      indexes: full,
      policies: readOnly,
      triggers: full,
    },
    triggers: {
      body: true,
      events: ROW_EVENTS,
      multipleEvents: true,
      orientations: ['STATEMENT'],
      timings: ['AFTER', 'INSTEAD OF'],
      toggle: true,
    },
  },
  [ConnectionType.MySQL]: {
    cascade: false,
    enumsLabel: 'Enums & Sets',
    explain: true,
    // InnoDB parses SET DEFAULT but rejects the table.
    functions: {
      behaviors: FUNCTION_DETERMINISM,
      languages: [],
      securityDefiner: false,
    },
    referentialActions: REFERENTIAL_ACTIONS.filter(
      (action) => action !== 'SET DEFAULT'
    ),
    renameColumns: true,
    renameConstraints: false,
    rowLevelSecurity: false,
    schemas: true,
    sections: {
      constraints: full,
      enums: { edit: true },
      functions: full,
      indexes: full,
      policies: readOnly,
      triggers: full,
    },
    triggers: {
      body: true,
      events: ROW_EVENTS,
      multipleEvents: false,
      orientations: ['ROW'],
      timings: ['BEFORE', 'AFTER'],
      toggle: false,
    },
  },
  [ConnectionType.Postgres]: {
    cascade: true,
    enumsLabel: 'Enums',
    explain: true,
    functions: {
      behaviors: FUNCTION_VOLATILITIES,
      languages: ['plpgsql', 'sql'],
      securityDefiner: true,
    },
    referentialActions: REFERENTIAL_ACTIONS,
    renameColumns: true,
    renameConstraints: true,
    rowLevelSecurity: true,
    schemas: true,
    sections: {
      constraints: full,
      enums: full,
      functions: full,
      indexes: full,
      policies: full,
      triggers: full,
    },
    triggers: {
      body: false,
      events: TRIGGER_EVENTS,
      multipleEvents: true,
      orientations: TRIGGER_ORIENTATIONS,
      timings: TRIGGER_TIMINGS,
      toggle: true,
    },
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
