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
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { uppercaseFirst } from '@tamery/shared/utils'

import type {
  ConstraintKind,
  ReferentialAction,
} from './queries/constraints/shape'
import {
  CONSTRAINT_KINDS,
  REFERENTIAL_ACTIONS,
} from './queries/constraints/shape'
import {
  FUNCTION_DETERMINISM,
  FUNCTION_VOLATILITIES,
} from './queries/functions/shape'
import { SKIP_INDEX_TYPES } from './queries/indexes/shape'
import type { PolicyCommand } from './queries/policies/shape'
import { POLICY_COMMANDS } from './queries/policies/shape'
import type { RelationKind } from './queries/tables/list'
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
  argumentPlaceholder: string
  behaviors: readonly string[]
  languages: readonly string[]
  securityDefiner: boolean
}

interface IndexCapabilities {
  rename: boolean
  // Data-skipping index types; offering any swaps Unique for Type and Granularity.
  skipTypes: readonly string[]
}

interface PolicyCapabilities {
  // ClickHouse's ALTER ROW POLICY rewrites every clause, so nothing recreates.
  alterInPlace: boolean
  commands: readonly PolicyCommand[]
  everyone: string
}

interface TriggerCapabilities {
  body: boolean
  events: readonly TriggerEvent[]
  insteadOfTargets: readonly RelationKind[]
  multipleEvents: boolean
  orientations: readonly TriggerOrientation[]
  timings: readonly TriggerTiming[]
  toggle: boolean
}

interface ConnectionCapabilities {
  cascade: boolean
  constraintKinds: readonly ConstraintKind[]
  ddlRollback: boolean
  // null: the connection's database is the schema
  defaultSchema: string | null
  explain: boolean
  fixedConstraintNames: Partial<Record<ConstraintKind, string>>
  functions: FunctionCapabilities
  indexes: IndexCapabilities
  policies: PolicyCapabilities
  referentialActions: readonly ReferentialAction[]
  renameColumns: boolean
  rowLevelSecurity: boolean
  renameConstraints: boolean
  schemas: boolean
  sections: Record<DefinitionsSection, SectionCapabilities | false>
  systemSchemas: readonly string[]
  triggers: TriggerCapabilities
}

// Only Postgres fires a trigger on TRUNCATE, and only per statement.
const ROW_EVENTS = TRIGGER_EVENTS.filter((event) => event !== 'TRUNCATE')

const readOnly: SectionCapabilities = {}
const full: SectionCapabilities = { create: true, drop: true, edit: true }

const btreeIndexes: IndexCapabilities = { rename: true, skipTypes: [] }
const noPolicies: PolicyCapabilities = {
  alterInPlace: false,
  commands: [],
  everyone: '',
}

const capabilities: Record<ConnectionType, ConnectionCapabilities> = {
  [ConnectionType.ClickHouse]: {
    cascade: false,
    constraintKinds: ['check'],
    ddlRollback: false,
    defaultSchema: null,
    explain: false,
    fixedConstraintNames: {},
    functions: {
      argumentPlaceholder: '',
      behaviors: [],
      languages: [],
      securityDefiner: false,
    },
    indexes: { rename: false, skipTypes: SKIP_INDEX_TYPES },
    policies: {
      alterInPlace: true,
      commands: ['SELECT'],
      everyone: 'ALL',
    },
    referentialActions: REFERENTIAL_ACTIONS,
    renameColumns: false,
    renameConstraints: false,
    rowLevelSecurity: false,
    schemas: false,
    sections: {
      constraints: full,
      enums: readOnly,
      functions: false,
      indexes: full,
      policies: full,
      privileges: false,
      triggers: false,
    },
    systemSchemas: [],
    triggers: {
      body: false,
      events: [],
      insteadOfTargets: [],
      multipleEvents: false,
      orientations: [],
      timings: [],
      toggle: false,
    },
  },
  [ConnectionType.MSSQL]: {
    cascade: false,
    constraintKinds: CONSTRAINT_KINDS,
    ddlRollback: true,
    defaultSchema: 'dbo',
    explain: false,
    fixedConstraintNames: {},
    functions: {
      argumentPlaceholder: '@id int, @label nvarchar(50)',
      behaviors: [],
      languages: [],
      securityDefiner: false,
    },
    indexes: btreeIndexes,
    policies: noPolicies,
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
      privileges: false,
      triggers: full,
    },
    systemSchemas: ['sys', 'INFORMATION_SCHEMA'],
    triggers: {
      body: true,
      events: ROW_EVENTS,
      insteadOfTargets: ['table', 'view'],
      multipleEvents: true,
      orientations: ['STATEMENT'],
      timings: ['AFTER', 'INSTEAD OF'],
      toggle: true,
    },
  },
  [ConnectionType.MySQL]: {
    cascade: false,
    constraintKinds: CONSTRAINT_KINDS,
    // MySQL commits DDL implicitly, so a drop-then-create warns before it runs.
    ddlRollback: false,
    defaultSchema: null,
    explain: true,
    // MySQL names every primary key PRIMARY, whatever the ADD says.
    fixedConstraintNames: { primaryKey: 'PRIMARY' },
    functions: {
      argumentPlaceholder: 'id INT, label VARCHAR(50)',
      behaviors: FUNCTION_DETERMINISM,
      languages: [],
      securityDefiner: false,
    },
    indexes: btreeIndexes,
    policies: noPolicies,
    // InnoDB parses SET DEFAULT but rejects the table.
    referentialActions: REFERENTIAL_ACTIONS.filter(
      (action) => action !== 'SET DEFAULT'
    ),
    renameColumns: true,
    renameConstraints: false,
    rowLevelSecurity: false,
    schemas: true,
    sections: {
      constraints: full,
      enums: false,
      functions: full,
      indexes: full,
      policies: false,
      privileges: { create: true, drop: true },
      triggers: full,
    },
    systemSchemas: ['mysql', 'information_schema', 'performance_schema', 'sys'],
    triggers: {
      body: true,
      events: ROW_EVENTS,
      insteadOfTargets: [],
      multipleEvents: false,
      orientations: ['ROW'],
      timings: ['BEFORE', 'AFTER'],
      toggle: false,
    },
  },
  [ConnectionType.Postgres]: {
    cascade: true,
    constraintKinds: CONSTRAINT_KINDS,
    ddlRollback: true,
    defaultSchema: 'public',
    explain: true,
    fixedConstraintNames: {},
    functions: {
      argumentPlaceholder: 'id integer, label text',
      behaviors: FUNCTION_VOLATILITIES,
      languages: ['plpgsql', 'sql'],
      securityDefiner: true,
    },
    indexes: btreeIndexes,
    policies: {
      alterInPlace: false,
      commands: POLICY_COMMANDS,
      everyone: 'PUBLIC',
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
      privileges: false,
      triggers: full,
    },
    systemSchemas: ['pg_catalog', 'information_schema'],
    triggers: {
      body: false,
      events: TRIGGER_EVENTS,
      insteadOfTargets: ['view'],
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
  privileges: { cascade: false, icon: LockKeyIcon, noun: 'privilege' },
  triggers: { cascade: false, icon: FlashIcon, noun: 'trigger' },
} as const satisfies Record<
  DefinitionsSection,
  { cascade: boolean; icon: IconSvgElement; noun: string }
>

export const capabilitiesOf = (type: ConnectionType) => capabilities[type]

export const defaultSchemaOf = (
  type: ConnectionType,
  database: string | null
) => capabilities[type].defaultSchema ?? database

export const sectionMetaOf = (section: DefinitionsSection) => ({
  ...sectionMeta[section],
  title: uppercaseFirst(section),
})

export const sectionAvailable = (
  section: DefinitionsSection,
  type: ConnectionType
) => capabilities[type].sections[section] !== false

export const sectionCapabilitiesOf = (
  section: DefinitionsSection,
  type: ConnectionType
): SectionCapabilities => capabilities[type].sections[section] || readOnly
