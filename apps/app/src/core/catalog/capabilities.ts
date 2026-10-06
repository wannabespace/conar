import { ConnectionType } from '@tamery/shared/enums/connection-type'

import type {
  ConstraintKind,
  ReferentialAction,
} from '~/core/queries/constraints/shape'
import {
  CONSTRAINT_KINDS,
  REFERENTIAL_ACTIONS,
} from '~/core/queries/constraints/shape'
import {
  FUNCTION_DETERMINISM,
  FUNCTION_VOLATILITIES,
} from '~/core/queries/functions/shape'
import { SKIP_INDEX_TYPES } from '~/core/queries/indexes/shape'
import type { PolicyCommand } from '~/core/queries/policies/shape'
import { POLICY_COMMANDS } from '~/core/queries/policies/shape'
import type { RelationKind } from '~/core/queries/tables/list'
import type {
  TriggerEvent,
  TriggerOrientation,
  TriggerTiming,
} from '~/core/queries/triggers/shape'
import {
  TRIGGER_EVENTS,
  TRIGGER_ORIENTATIONS,
  TRIGGER_TIMINGS,
} from '~/core/queries/triggers/shape'

import { COLUMN_TYPES } from './column-types'
import type { DefinitionsSection } from './sections'

export interface SectionCapabilities {
  create?: boolean
  drop?: boolean
  edit?: boolean
}

interface FunctionCapabilities {
  argumentPlaceholder: string
  behaviors: readonly string[]
  languages: readonly string[]
  schemaBinding: boolean
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
  predicates: boolean
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

export interface ArrayType {
  close: string
  open: string
}

interface ConnectionCapabilities {
  arrayType: ArrayType | null
  // Column types whose values the driver hands over as bytes; Postgres reads `bytea` as text, so it lists none.
  bytesColumnTypes: readonly string[]
  cascade: boolean
  columnTypes: readonly string[]
  constraintKinds: readonly ConstraintKind[]
  ddlRollback: boolean
  // null: the connection's database is the schema
  defaultSchema: string | null
  explain: boolean
  fixedConstraintNames: Partial<Record<ConstraintKind, string>>
  functions: FunctionCapabilities
  idColumnType: string
  indexes: IndexCapabilities
  // Column types edited as JSON text; ClickHouse reads its composite types back as JSON too.
  jsonColumnType: RegExp
  policies: PolicyCapabilities
  referentialActions: readonly ReferentialAction[]
  renameColumns: boolean
  rowLevelSecurity: boolean
  renameConstraints: boolean
  renameSchema: boolean
  schemas: boolean
  sections: Record<DefinitionsSection, SectionCapabilities | false>
  // `UPDATE … SET column = DEFAULT`; ClickHouse's ALTER UPDATE takes expressions only.
  setDefault: boolean
  systemSchemas: readonly string[]
  triggers: TriggerCapabilities
}

// Only Postgres fires a trigger on TRUNCATE, and only per statement.
const ROW_EVENTS = TRIGGER_EVENTS.filter((event) => event !== 'TRUNCATE')

const readOnly: SectionCapabilities = {}
const full: SectionCapabilities = { create: true, drop: true, edit: true }

const btreeIndexes: IndexCapabilities = { rename: true, skipTypes: [] }
const noFunctions: FunctionCapabilities = {
  argumentPlaceholder: '',
  behaviors: [],
  languages: [],
  schemaBinding: false,
  securityDefiner: false,
}
const noPolicies: PolicyCapabilities = {
  alterInPlace: false,
  commands: [],
  everyone: '',
  predicates: false,
}
const noTriggers: TriggerCapabilities = {
  body: false,
  events: [],
  insteadOfTargets: [],
  multipleEvents: false,
  orientations: [],
  timings: [],
  toggle: false,
}

const JSON_COLUMN_TYPE = /^json$/iu

const capabilities: Record<ConnectionType, ConnectionCapabilities> = {
  [ConnectionType.ClickHouse]: {
    arrayType: { close: ')', open: 'Array(' },
    bytesColumnTypes: [],
    cascade: false,
    columnTypes: COLUMN_TYPES[ConnectionType.ClickHouse],
    constraintKinds: ['check'],
    ddlRollback: false,
    defaultSchema: null,
    explain: false,
    fixedConstraintNames: {},
    functions: noFunctions,
    idColumnType: 'UInt64',
    indexes: { rename: false, skipTypes: SKIP_INDEX_TYPES },
    jsonColumnType: /json|\b(?:Map|Nested|Tuple|Variant)\(/iu,
    policies: {
      alterInPlace: true,
      commands: ['SELECT'],
      everyone: 'ALL',
      predicates: false,
    },
    referentialActions: REFERENTIAL_ACTIONS,
    renameColumns: false,
    renameConstraints: false,
    renameSchema: false,
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
    setDefault: false,
    systemSchemas: [],
    triggers: noTriggers,
  },
  [ConnectionType.MSSQL]: {
    arrayType: null,
    bytesColumnTypes: ['binary', 'image', 'varbinary'],
    cascade: false,
    columnTypes: COLUMN_TYPES[ConnectionType.MSSQL],
    constraintKinds: CONSTRAINT_KINDS,
    ddlRollback: true,
    defaultSchema: 'dbo',
    explain: false,
    fixedConstraintNames: {},
    functions: {
      argumentPlaceholder: '@id int, @label nvarchar(50)',
      behaviors: [],
      languages: [],
      schemaBinding: true,
      securityDefiner: false,
    },
    idColumnType: 'int',
    indexes: btreeIndexes,
    jsonColumnType: JSON_COLUMN_TYPE,
    policies: { ...noPolicies, predicates: true },
    referentialActions: REFERENTIAL_ACTIONS.filter(
      (action) => action !== 'RESTRICT'
    ),
    renameColumns: true,
    renameConstraints: true,
    renameSchema: false,
    rowLevelSecurity: false,
    schemas: true,
    sections: {
      constraints: full,
      enums: false,
      functions: full,
      indexes: full,
      policies: full,
      privileges: false,
      triggers: full,
    },
    setDefault: true,
    systemSchemas: ['sys', 'INFORMATION_SCHEMA', 'guest'],
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
    arrayType: null,
    bytesColumnTypes: [
      'binary',
      'bit',
      'blob',
      'longblob',
      'mediumblob',
      'tinyblob',
      'varbinary',
    ],
    cascade: false,
    columnTypes: COLUMN_TYPES[ConnectionType.MySQL],
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
      schemaBinding: false,
      securityDefiner: false,
    },
    idColumnType: 'int',
    indexes: btreeIndexes,
    jsonColumnType: JSON_COLUMN_TYPE,
    policies: noPolicies,
    // InnoDB parses SET DEFAULT but rejects the table.
    referentialActions: REFERENTIAL_ACTIONS.filter(
      (action) => action !== 'SET DEFAULT'
    ),
    renameColumns: true,
    renameConstraints: false,
    renameSchema: false,
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
    setDefault: true,
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
    arrayType: { close: '[]', open: '' },
    bytesColumnTypes: [],
    cascade: true,
    columnTypes: COLUMN_TYPES[ConnectionType.Postgres],
    constraintKinds: CONSTRAINT_KINDS,
    ddlRollback: true,
    defaultSchema: 'public',
    explain: true,
    fixedConstraintNames: {},
    functions: {
      argumentPlaceholder: 'id integer, label text',
      behaviors: FUNCTION_VOLATILITIES,
      languages: ['plpgsql', 'sql'],
      schemaBinding: false,
      securityDefiner: true,
    },
    idColumnType: 'integer',
    indexes: btreeIndexes,
    jsonColumnType: /^jsonb?$/iu,
    policies: {
      alterInPlace: false,
      commands: POLICY_COMMANDS,
      everyone: 'PUBLIC',
      predicates: false,
    },
    referentialActions: REFERENTIAL_ACTIONS,
    renameColumns: true,
    renameConstraints: true,
    renameSchema: true,
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
    setDefault: true,
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

export const capabilitiesOf = (type: ConnectionType) => capabilities[type]

export const defaultSchemaOf = (
  type: ConnectionType,
  database: string | null
) => capabilities[type].defaultSchema ?? database

export const sectionAvailable = (
  section: DefinitionsSection,
  type: ConnectionType
) => capabilities[type].sections[section] !== false

export const sectionCapabilitiesOf = (
  section: DefinitionsSection,
  type: ConnectionType
): SectionCapabilities => capabilities[type].sections[section] || readOnly
