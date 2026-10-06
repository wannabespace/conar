import type {
  ConstraintKind,
  ReferentialAction,
} from '~/core/queries/constraints/shape'
import type { PolicyCommand } from '~/core/queries/policies/shape'
import type { RelationKind } from '~/core/queries/tables/list'
import type {
  TriggerEvent,
  TriggerOrientation,
  TriggerTiming,
} from '~/core/queries/triggers/shape'
import { TRIGGER_EVENTS } from '~/core/queries/triggers/shape'

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

export interface ConnectionCapabilities {
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
  ilike: boolean
  // Column types ORDER BY, GROUP BY or COUNT(DISTINCT) reject; Distinct Values also skips `bytesColumnTypes`.
  incomparableColumnType: RegExp | null
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
  uuidColumnType: RegExp | null
  xmlColumnType: RegExp | null
}

// Only Postgres fires a trigger on TRUNCATE, and only per statement.
export const ROW_EVENTS = TRIGGER_EVENTS.filter((event) => event !== 'TRUNCATE')

export const readOnly: SectionCapabilities = {}
export const full: SectionCapabilities = {
  create: true,
  drop: true,
  edit: true,
}

export const btreeIndexes: IndexCapabilities = { rename: true, skipTypes: [] }
export const noFunctions: FunctionCapabilities = {
  argumentPlaceholder: '',
  behaviors: [],
  languages: [],
  schemaBinding: false,
  securityDefiner: false,
}
export const noPolicies: PolicyCapabilities = {
  alterInPlace: false,
  commands: [],
  everyone: '',
  predicates: false,
}
export const noTriggers: TriggerCapabilities = {
  body: false,
  events: [],
  insteadOfTargets: [],
  multipleEvents: false,
  orientations: [],
  timings: [],
  toggle: false,
}

export const JSON_COLUMN_TYPE = /^json$/iu
