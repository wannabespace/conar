import { SQLITE_RESOURCE_NAME } from '@tamery/connection/sqlite-file'
import { Dialect } from '@tamery/shared/enums/connection-type'

import {
  CONSTRAINT_KINDS,
  REFERENTIAL_ACTIONS,
} from '~/core/queries/constraints/shape'
import {
  FUNCTION_DETERMINISM,
  FUNCTION_VOLATILITIES,
} from '~/core/queries/functions/shape'
import { SKIP_INDEX_TYPES } from '~/core/queries/indexes/shape'
import { POLICY_COMMANDS } from '~/core/queries/policies/shape'
import { clickhouseEnum, mysqlEnum } from '~/core/queries/shared/inline-enum'
import {
  TRIGGER_EVENTS,
  TRIGGER_ORIENTATIONS,
  TRIGGER_TIMINGS,
} from '~/core/queries/triggers/shape'

import type {
  ConnectionCapabilities,
  SectionCapabilities,
} from './capability-presets'
import {
  btreeIndexes,
  full,
  JSON_COLUMN_TYPE,
  noFunctions,
  noPolicies,
  noTriggers,
  readOnly,
  ROW_EVENTS,
} from './capability-presets'
import { COLUMN_TYPES } from './column-types'
import type { DefinitionsSection } from './sections'

export type { ArrayType, SectionCapabilities } from './capability-presets'

const capabilities: Record<Dialect, ConnectionCapabilities> = {
  [Dialect.ClickHouse]: {
    alterColumns: true,
    cascade: false,
    columnTypes: {
      array: { close: ')', open: 'Array(' },
      bytes: null,
      enum: clickhouseEnum,
      id: 'UInt64',
      incomparable:
        /\b(?:JSON|Object|Dynamic|Variant|Geometry)\b|(?<!Simple)AggregateFunction/u,
      json: /json|\b(?:Map|Nested|Tuple|Variant)\(/iu,
      options: COLUMN_TYPES[Dialect.ClickHouse],
      uuid: /\bUUID\b/u,
      xml: null,
    },
    comments: true,
    constraintKinds: ['check'],
    ddlRollback: false,
    defaultSchema: null,
    explain: false,
    fixedConstraintNames: {},
    functions: noFunctions,
    ilike: true,
    indexes: { rename: false, skipTypes: SKIP_INDEX_TYPES },
    materializedViews: true,
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
    renameViews: true,
    retypeKeyColumns: false,
    rowLevelSecurity: false,
    schemas: false,
    sections: {
      constraints: full,
      enums: false,
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
  [Dialect.MSSQL]: {
    alterColumns: true,
    cascade: false,
    columnTypes: {
      array: null,
      bytes: /^(?:binary|image|timestamp|varbinary)$/iu,
      enum: null,
      id: 'int identity',
      incomparable: /^(?:n?text|image|xml|json|vector|geometry|geography)$/iu,
      json: JSON_COLUMN_TYPE,
      options: COLUMN_TYPES[Dialect.MSSQL],
      uuid: /^uniqueidentifier$/iu,
      xml: /^xml$/iu,
    },
    comments: true,
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
    ilike: false,
    indexes: btreeIndexes,
    materializedViews: false,
    policies: { ...noPolicies, predicates: true },
    referentialActions: REFERENTIAL_ACTIONS.filter(
      (action) => action !== 'RESTRICT'
    ),
    renameColumns: true,
    renameConstraints: true,
    renameSchema: false,
    // sp_rename leaves the old name in the view's stored definition, which a refresh or scripted recreate brings back.
    renameViews: false,
    retypeKeyColumns: false,
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
  [Dialect.MySQL]: {
    alterColumns: true,
    cascade: false,
    columnTypes: {
      array: null,
      bytes: /^(?:binary|bit|(?:tiny|medium|long)?blob|varbinary)$/iu,
      enum: mysqlEnum,
      id: 'int auto_increment',
      incomparable: null,
      json: JSON_COLUMN_TYPE,
      options: COLUMN_TYPES[Dialect.MySQL],
      // MariaDB's native UUID; MySQL has none.
      uuid: /^uuid$/iu,
      xml: null,
    },
    comments: true,
    constraintKinds: CONSTRAINT_KINDS,
    ddlRollback: false,
    defaultSchema: null,
    explain: true,
    fixedConstraintNames: { primaryKey: 'PRIMARY' },
    functions: {
      argumentPlaceholder: 'id INT, label VARCHAR(50)',
      behaviors: FUNCTION_DETERMINISM,
      languages: [],
      schemaBinding: false,
      securityDefiner: false,
    },
    ilike: false,
    indexes: btreeIndexes,
    materializedViews: false,
    policies: noPolicies,
    // InnoDB parses SET DEFAULT but rejects the table.
    referentialActions: REFERENTIAL_ACTIONS.filter(
      (action) => action !== 'SET DEFAULT'
    ),
    renameColumns: true,
    renameConstraints: false,
    renameSchema: false,
    renameViews: true,
    retypeKeyColumns: true,
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
  [Dialect.Postgres]: {
    alterColumns: true,
    cascade: true,
    columnTypes: {
      array: { close: '[]', open: '' },
      bytes: null,
      enum: null,
      id: 'serial',
      incomparable:
        /^(?:json|jsonpath|xml|bytea|point|line|lseg|box|path|polygon|circle|xid|cid|aclitem|refcursor|txid_snapshot|pg_snapshot)$/iu,
      json: /^jsonb?$/iu,
      options: COLUMN_TYPES[Dialect.Postgres],
      uuid: /^uuid$/iu,
      xml: /^xml$/iu,
    },
    comments: true,
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
    ilike: true,
    indexes: btreeIndexes,
    materializedViews: true,
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
    renameViews: true,
    retypeKeyColumns: true,
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
  [Dialect.SQLite]: {
    alterColumns: false,
    cascade: false,
    columnTypes: {
      array: null,
      bytes: /^blob$/iu,
      enum: null,
      id: 'integer',
      incomparable: null,
      json: JSON_COLUMN_TYPE,
      options: COLUMN_TYPES[Dialect.SQLite],
      uuid: null,
      xml: null,
    },
    comments: false,
    constraintKinds: CONSTRAINT_KINDS,
    ddlRollback: true,
    defaultSchema: SQLITE_RESOURCE_NAME,
    explain: false,
    fixedConstraintNames: {},
    functions: noFunctions,
    ilike: false,
    indexes: { rename: false, skipTypes: [] },
    materializedViews: false,
    policies: noPolicies,
    referentialActions: REFERENTIAL_ACTIONS,
    renameColumns: true,
    renameConstraints: false,
    renameSchema: false,
    renameViews: false,
    retypeKeyColumns: false,
    rowLevelSecurity: false,
    schemas: false,
    // A constraint lives in its table's CREATE statement, which only a rebuild changes.
    sections: {
      constraints: readOnly,
      enums: false,
      functions: false,
      indexes: full,
      policies: false,
      privileges: false,
      triggers: full,
    },
    setDefault: false,
    systemSchemas: [],
    triggers: {
      body: true,
      events: ROW_EVENTS,
      insteadOfTargets: ['view'],
      multipleEvents: false,
      orientations: ['ROW'],
      timings: TRIGGER_TIMINGS,
      toggle: false,
    },
  },
}

export const getCapabilities = (dialect: Dialect) => capabilities[dialect]

export const getDefaultSchema = (dialect: Dialect, database: string | null) =>
  capabilities[dialect].defaultSchema ?? database

export const sectionAvailable = (
  section: DefinitionsSection,
  dialect: Dialect
) => capabilities[dialect].sections[section] !== false

export const getSectionCapabilities = (
  section: DefinitionsSection,
  dialect: Dialect
): SectionCapabilities => capabilities[dialect].sections[section] || readOnly

export const foreignKeysCreatable = (dialect: Dialect) =>
  capabilities[dialect].constraintKinds.includes('foreignKey') &&
  !!getSectionCapabilities('constraints', dialect).create
