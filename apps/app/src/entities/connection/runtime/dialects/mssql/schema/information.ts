export interface InformationSchema {
  TABLES: Tables
  COLUMNS: Columns
  VIEWS: Views
  TABLE_CONSTRAINTS: TableConstraints
  CHECK_CONSTRAINTS: CheckConstraints
  KEY_COLUMN_USAGE: KeyColumnUsage
  CONSTRAINT_COLUMN_USAGE: ConstraintColumnUsage
  REFERENTIAL_CONSTRAINTS: ReferentialConstraints
}

interface Tables {
  TABLE_CATALOG: string
  TABLE_SCHEMA: string
  TABLE_NAME: string
  TABLE_TYPE: 'BASE TABLE' | 'VIEW'
}

interface Views {
  TABLE_CATALOG: string
  TABLE_SCHEMA: string
  TABLE_NAME: string
  VIEW_DEFINITION: string
  CHECK_OPTION: 'NONE' | 'CASCADE' | 'LOCAL'
  IS_UPDATABLE: 'YES' | 'NO'
}

interface Columns {
  TABLE_CATALOG: string
  TABLE_SCHEMA: string
  TABLE_NAME: string
  COLUMN_NAME: string
  ORDINAL_POSITION: number
  COLUMN_DEFAULT: string | null
  IS_NULLABLE: 'YES' | 'NO'
  DATA_TYPE: string
  CHARACTER_MAXIMUM_LENGTH: number | null
  CHARACTER_OCTET_LENGTH: number | null
  NUMERIC_PRECISION: number | null
  NUMERIC_PRECISION_RADIX: number | null
  NUMERIC_SCALE: number | null
  DATETIME_PRECISION: number | null
  CHARACTER_SET_CATALOG: string | null
  CHARACTER_SET_SCHEMA: string | null
  CHARACTER_SET_NAME: string | null
  COLLATION_CATALOG: string | null
  COLLATION_SCHEMA: string | null
  COLLATION_NAME: string | null
  DOMAIN_CATALOG: string | null
  DOMAIN_SCHEMA: string | null
  DOMAIN_NAME: string | null
}

interface TableConstraints {
  CONSTRAINT_CATALOG: string
  CONSTRAINT_SCHEMA: string
  CONSTRAINT_NAME: string
  TABLE_SCHEMA: string
  TABLE_NAME: string
  CONSTRAINT_TYPE: 'PRIMARY KEY' | 'UNIQUE' | 'FOREIGN KEY' | 'CHECK'
  IS_DEFERRABLE: 'YES' | 'NO'
  INITIALLY_DEFERRED: 'YES' | 'NO'
}

interface CheckConstraints {
  CONSTRAINT_SCHEMA: string
  CONSTRAINT_NAME: string
  CHECK_CLAUSE: string
}

interface KeyColumnUsage {
  CONSTRAINT_CATALOG: string
  CONSTRAINT_SCHEMA: string
  CONSTRAINT_NAME: string
  TABLE_CATALOG: string
  TABLE_SCHEMA: string
  TABLE_NAME: string
  COLUMN_NAME: string
  ORDINAL_POSITION: number
}

interface ConstraintColumnUsage {
  TABLE_CATALOG: string
  TABLE_SCHEMA: string
  TABLE_NAME: string
  COLUMN_NAME: string
  CONSTRAINT_CATALOG: string
  CONSTRAINT_SCHEMA: string
  CONSTRAINT_NAME: string
}

interface ReferentialConstraints {
  CONSTRAINT_CATALOG: string
  CONSTRAINT_SCHEMA: string
  CONSTRAINT_NAME: string
  UNIQUE_CONSTRAINT_CATALOG: string
  UNIQUE_CONSTRAINT_SCHEMA: string
  UNIQUE_CONSTRAINT_NAME: string
  MATCH_OPTION: 'SIMPLE'
  UPDATE_RULE: 'NO ACTION' | 'CASCADE' | 'SET NULL' | 'SET DEFAULT'
  DELETE_RULE: 'NO ACTION' | 'CASCADE' | 'SET NULL' | 'SET DEFAULT'
}
