/**
 * @name information_schema
 * @type schema
 */
export interface InformationSchema {
  TABLES: Tables
  COLUMNS: Columns
  VIEWS: Views
  TABLE_CONSTRAINTS: TableConstraints
  KEY_COLUMN_USAGE: KeyColumnUsage
  CONSTRAINT_COLUMN_USAGE: ConstraintColumnUsage
}

/**
 * @name TABLES
 * @type table
 */
interface Tables {
  TABLE_CATALOG: string
  TABLE_SCHEMA: string
  TABLE_NAME: string
  TABLE_TYPE: 'BASE TABLE' | 'VIEW'
}

/**
 * @name VIEWS
 * @type table
 */
interface Views {
  TABLE_CATALOG: string
  TABLE_SCHEMA: string
  TABLE_NAME: string
  VIEW_DEFINITION: string
  CHECK_OPTION: 'NONE' | 'CASCADE' | 'LOCAL'
  IS_UPDATABLE: 'YES' | 'NO'
}

/**
 * @name COLUMNS
 * @type table
 */
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

/**
 * @name TABLE_CONSTRAINTS
 * @type table
 */
interface TableConstraints {
  CONSTRAINT_CATALOG: string
  CONSTRAINT_SCHEMA: string
  CONSTRAINT_NAME: string
  TABLE_SCHEMA: string
  TABLE_NAME: string
  CONSTRAINT_TYPE: 'PRIMARY KEY' | 'UNIQUE' | 'FOREIGN KEY'
  IS_DEFERRABLE: 'YES' | 'NO'
  INITIALLY_DEFERRED: 'YES' | 'NO'
}

/**
 * @name KEY_COLUMN_USAGE
 * @type table
 */
interface KeyColumnUsage {
  CONSTRAINT_CATALOG: string
  CONSTRAINT_SCHEMA: string
  CONSTRAINT_NAME: string
  TABLE_CATALOG: string
  TABLE_SCHEMA: string
  TABLE_NAME: string
  COLUMN_NAME: string
}

/**
 * @name CONSTRAINT_COLUMN_USAGE
 * @type table
 */
interface ConstraintColumnUsage {
  TABLE_CATALOG: string
  TABLE_SCHEMA: string
  TABLE_NAME: string
  COLUMN_NAME: string
  CONSTRAINT_CATALOG: string
  CONSTRAINT_SCHEMA: string
  CONSTRAINT_NAME: string
}
