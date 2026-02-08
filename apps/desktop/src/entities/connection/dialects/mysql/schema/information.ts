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
  STATISTICS: Statistics
  REFERENTIAL_CONSTRAINTS: ReferentialConstraints
  TABLE_PRIVILEGES: TablePrivileges
}

/**
 * @name TABLE_PRIVILEGES
 * @type table
 */
interface TablePrivileges {
  GRANTEE: string
  TABLE_SCHEMA: string
  TABLE_NAME: string
  PRIVILEGE_TYPE: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL'
  IS_GRANTABLE: string
}

/**
 * @name TABLES
 * @type table
 */
interface Tables {
  TABLE_CATALOG: string
  TABLE_SCHEMA: string
  TABLE_NAME: string
  TABLE_TYPE: 'BASE TABLE' | 'VIEW' | 'SYSTEM VIEW'
  ENGINE: string
  VERSION: number
  ROW_FORMAT: string
  TABLE_ROWS: number
  AVG_ROW_LENGTH: number
  DATA_LENGTH: number
  MAX_DATA_LENGTH: number
  INDEX_LENGTH: number
  DATA_FREE: number
  AUTO_INCREMENT: number | null
  CREATE_TIME: string
  UPDATE_TIME: string
  CHECK_TIME: string | null
  TABLE_COLLATION: string | null
  CHECKSUM: number | null
  CREATE_OPTIONS: string | null
  TABLE_COMMENT: string | null
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
  DEFINER: string
  SECURITY_TYPE: 'DEFINER' | 'INVOKER'
  CHARACTER_SET_CLIENT: string
  COLLATION_CONNECTION: string
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
  NUMERIC_SCALE: number | null
  DATETIME_PRECISION: number | null
  CHARACTER_SET_NAME: string | null
  COLLATION_NAME: string | null
  COLUMN_TYPE: string
  COLUMN_KEY: 'PRI' | 'UNI' | 'MUL' | ''
  EXTRA: string
  PRIVILEGES: string
  COLUMN_COMMENT: string
  GENERATION_EXPRESSION: string
  SRS_ID: number
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
  ENFORCED: 'YES' | 'NO'
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
  ORDINAL_POSITION: number
  POSITION_IN_UNIQUE_CONSTRAINT: number | null
  REFERENCED_TABLE_SCHEMA: string | null
  REFERENCED_TABLE_NAME: string | null
  REFERENCED_COLUMN_NAME: string | null
}

/**
 * @name STATISTICS
 * @type table
 */
interface Statistics {
  TABLE_SCHEMA: string
  TABLE_NAME: string
  INDEX_NAME: string
  COLUMN_NAME: string
  NON_UNIQUE: number
}

/**
 * @name REFERENTIAL_CONSTRAINTS
 * @type table
 */
interface ReferentialConstraints {
  CONSTRAINT_CATALOG: string
  CONSTRAINT_SCHEMA: string
  CONSTRAINT_NAME: string
  UNIQUE_CONSTRAINT_CATALOG: string
  UNIQUE_CONSTRAINT_SCHEMA: string
  UNIQUE_CONSTRAINT_NAME: string
  MATCH_OPTION: string
  UPDATE_RULE: string
  DELETE_RULE: string
  TABLE_NAME: string
  REFERENCED_TABLE_NAME: string
}
