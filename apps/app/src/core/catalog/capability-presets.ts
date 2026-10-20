import type {
  ConstraintKind,
  ReferentialAction,
} from '~/core/queries/constraints/shape'
import type { PolicyCommand } from '~/core/queries/policies/shape'
import type { InlineEnum } from '~/core/queries/shared/inline-enum'
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

export interface ColumnTypeCapabilities {
  array: ArrayType | null
  // Matched against the type label, which drops ClickHouse's Nullable and LowCardinality wrappers.
  boolean: RegExp | null
  // The driver hands these values over as bytes; Postgres reads `bytea` as text, so it matches none.
  bytes: RegExp | null
  // Words a date or timestamp column takes in place of a date; the rest fail on save.
  dateKeywords: RegExp | null
  // Named like a date but hold a time of day too (Oracle's DATE), so they edit as a datetime.
  datesWithTime: RegExp | null
  enum: InlineEnum | null
  id: string
  // ORDER BY, GROUP BY or COUNT(DISTINCT) reject these; Distinct Values also skips `bytes`.
  incomparable: RegExp | null
  // Edited as JSON text; ClickHouse reads its composite types back as JSON too.
  json: RegExp
  options: readonly string[]
  uuid: RegExp | null
  xml: RegExp | null
  // Hold an instant, so Now spells the local offset; the rest take the local wall clock.
  zoned: RegExp | null
}

/** What the UI calls a table, a column and a row: MongoDB's collections, fields and documents. */
export interface ObjectNames {
  column: string
  row: string
  table: string
}

export const SQL_NAMES: ObjectNames = {
  column: 'column',
  row: 'row',
  table: 'table',
}

export interface ConnectionCapabilities {
  alterColumns: boolean
  cascade: boolean
  columnTypes: ColumnTypeCapabilities
  comments: boolean
  constraintKinds: readonly ConstraintKind[]
  ddlRollback: boolean
  // Rows are documents: a table's columns are sampled, never declared, so none is added, edited or dropped.
  declaredColumns: boolean
  // null: the login's schema or the resource, resolved by getDefaultSchema
  defaultSchema: string | null
  explain: boolean
  fixedConstraintNames: Partial<Record<ConstraintKind, string>>
  foreignKeyOnUpdate: boolean
  functions: FunctionCapabilities
  ilike: boolean
  indexes: IndexCapabilities
  materializedViews: boolean
  names: ObjectNames
  policies: PolicyCapabilities
  referentialActions: readonly ReferentialAction[]
  renameColumns: boolean
  renameConstraints: boolean
  renameSchema: boolean
  renameViews: boolean
  // A routine or trigger save overwrites the object instead of dropping it first.
  replacesInPlace: boolean
  // A primary key column's type and nullability; SQL Server and ClickHouse refuse the ALTER.
  retypeKeyColumns: boolean
  rowLevelSecurity: boolean
  schemas: boolean
  sections: Record<DefinitionsSection, SectionCapabilities | false>
  // `UPDATE … SET column = DEFAULT`; ClickHouse's ALTER UPDATE takes expressions only.
  setDefault: boolean
  systemSchemas: readonly string[]
  triggers: TriggerCapabilities
}

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
