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

interface ColumnTypeCapabilities {
  array: ArrayType | null
  // The driver hands these values over as bytes; Postgres reads `bytea` as text, so it matches none.
  bytes: RegExp | null
  id: string
  // ORDER BY, GROUP BY or COUNT(DISTINCT) reject these; Distinct Values also skips `bytes`.
  incomparable: RegExp | null
  // Edited as JSON text; ClickHouse reads its composite types back as JSON too.
  json: RegExp
  options: readonly string[]
  uuid: RegExp | null
  xml: RegExp | null
}

export interface ConnectionCapabilities {
  cascade: boolean
  columnTypes: ColumnTypeCapabilities
  constraintKinds: readonly ConstraintKind[]
  ddlRollback: boolean
  // null: the connection's database is the schema
  defaultSchema: string | null
  explain: boolean
  fixedConstraintNames: Partial<Record<ConstraintKind, string>>
  functions: FunctionCapabilities
  ilike: boolean
  indexes: IndexCapabilities
  materializedViews: boolean
  policies: PolicyCapabilities
  referentialActions: readonly ReferentialAction[]
  renameColumns: boolean
  renameConstraints: boolean
  renameSchema: boolean
  renameViews: boolean
  rowLevelSecurity: boolean
  schemas: boolean
  sections: Record<DefinitionsSection, SectionCapabilities | false>
  // `UPDATE … SET column = DEFAULT`; ClickHouse's ALTER UPDATE takes expressions only.
  setDefault: boolean
  systemSchemas: readonly string[]
  triggers: TriggerCapabilities
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
