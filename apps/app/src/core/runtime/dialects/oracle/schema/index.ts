/** Oracle's data dictionary views, reached through their public synonyms and spelled in their stored (upper) case. */
export interface Database {
  ALL_ARGUMENTS: AllArguments
  ALL_COL_COMMENTS: AllColComments
  ALL_CONS_COLUMNS: AllConsColumns
  ALL_CONSTRAINTS: AllConstraints
  ALL_ERRORS: {
    OWNER: string
    NAME: string
    TYPE: string
    SEQUENCE: number
    LINE: number
    POSITION: number
    TEXT: string
    ATTRIBUTE: 'ERROR' | 'WARNING'
  }
  ALL_IND_COLUMNS: AllIndColumns
  ALL_IND_EXPRESSIONS: AllIndExpressions
  ALL_INDEXES: AllIndexes
  ALL_MVIEW_COMMENTS: {
    OWNER: string
    MVIEW_NAME: string
    COMMENTS: string | null
  }
  ALL_MVIEWS: AllMviews
  ALL_OBJECTS: AllObjects
  ALL_PROCEDURES: AllProcedures
  ALL_SOURCE: AllSource
  ALL_TAB_COLS: AllTabColumns
  ALL_TAB_COLUMNS: AllTabColumns
  ALL_TAB_COMMENTS: AllTabComments
  ALL_TAB_IDENTITY_COLS: {
    OWNER: string
    TABLE_NAME: string
    COLUMN_NAME: string
    GENERATION_TYPE: 'ALWAYS' | 'BY DEFAULT'
  }
  ALL_TAB_PRIVS: AllTabPrivs
  ALL_TABLES: AllTables
  ALL_TRIGGER_COLS: {
    TRIGGER_OWNER: string
    TRIGGER_NAME: string
    COLUMN_NAME: string
    /** `YES` for a column named in `UPDATE OF`. */
    COLUMN_LIST: YesNo
  }
  ALL_TRIGGER_ORDERING: {
    TRIGGER_OWNER: string
    TRIGGER_NAME: string
    ORDERING_TYPE: 'FOLLOWS' | 'PRECEDES'
  }
  ALL_TRIGGERS: AllTriggers
  ALL_USERS: AllUsers
  ALL_VIEWS: AllViews
  DATABASE_PROPERTIES: { PROPERTY_NAME: string; PROPERTY_VALUE: string }
  DUAL: { DUMMY: string }
  PRODUCT_COMPONENT_VERSION: ProductComponentVersion
}

type YesNo = 'NO' | 'YES'
type YN = 'N' | 'Y'

interface AllUsers {
  USERNAME: string
  USER_ID: number
  CREATED: Date
  /** 12c and up: `Y` for the accounts Oracle ships (SYS, XDB, MDSYS…). */
  ORACLE_MAINTAINED: YN
  COMMON: YesNo
}

interface AllTables {
  OWNER: string
  TABLE_NAME: string
  TABLESPACE_NAME: string | null
  NUM_ROWS: number | null
  TEMPORARY: YN
  NESTED: YesNo
  SECONDARY: YN
  IOT_TYPE: string | null
  DROPPED: YesNo
}

interface AllViews {
  OWNER: string
  VIEW_NAME: string
  TEXT_LENGTH: number
  TEXT: string | null
  /** 12c and up; TEXT is a LONG, which no SQL function takes. */
  TEXT_VC: string | null
  READ_ONLY: YN
}

interface AllMviews {
  OWNER: string
  MVIEW_NAME: string
  CONTAINER_NAME: string
  QUERY: string
  UPDATABLE: YN
  REFRESH_MODE: string
  REFRESH_METHOD: string
  BUILD_MODE: string
}

interface AllObjects {
  OWNER: string
  OBJECT_NAME: string
  SUBOBJECT_NAME: string | null
  OBJECT_ID: number
  OBJECT_TYPE: string
  CREATED: Date
  LAST_DDL_TIME: Date
  STATUS: 'INVALID' | 'VALID'
  TEMPORARY: YN
  GENERATED: YN
  ORACLE_MAINTAINED: YN
}

interface AllTabColumns {
  OWNER: string
  TABLE_NAME: string
  COLUMN_NAME: string
  DATA_TYPE: string
  DATA_TYPE_OWNER: string | null
  DATA_LENGTH: number
  DATA_PRECISION: number | null
  DATA_SCALE: number | null
  NULLABLE: YN
  COLUMN_ID: number | null
  DATA_DEFAULT: string | null
  CHAR_LENGTH: number
  CHAR_USED: 'B' | 'C' | null
  HIDDEN_COLUMN: YesNo
  VIRTUAL_COLUMN: YesNo
  USER_GENERATED: YesNo
  IDENTITY_COLUMN: YesNo
  DEFAULT_ON_NULL: YesNo
}

interface AllTabComments {
  OWNER: string
  TABLE_NAME: string
  TABLE_TYPE: string
  COMMENTS: string | null
}

interface AllColComments {
  OWNER: string
  TABLE_NAME: string
  COLUMN_NAME: string
  COMMENTS: string | null
}

interface AllConstraints {
  OWNER: string
  CONSTRAINT_NAME: string
  /** P primary key, U unique, R foreign key, C check or NOT NULL, V view check option, O read-only view. */
  CONSTRAINT_TYPE: 'C' | 'O' | 'P' | 'R' | 'U' | 'V'
  TABLE_NAME: string
  SEARCH_CONDITION: string | null
  /** 12c and up; SEARCH_CONDITION is a LONG, which no SQL function takes. */
  SEARCH_CONDITION_VC: string | null
  R_OWNER: string | null
  R_CONSTRAINT_NAME: string | null
  DELETE_RULE: 'CASCADE' | 'NO ACTION' | 'SET NULL' | null
  STATUS: 'DISABLED' | 'ENABLED'
  DEFERRABLE: string | null
  DEFERRED: string | null
  VALIDATED: string | null
  GENERATED: 'GENERATED NAME' | 'USER NAME'
  INDEX_OWNER: string | null
  INDEX_NAME: string | null
}

interface AllConsColumns {
  OWNER: string
  CONSTRAINT_NAME: string
  TABLE_NAME: string
  COLUMN_NAME: string
  POSITION: number | null
}

interface AllIndexes {
  OWNER: string
  INDEX_NAME: string
  INDEX_TYPE: string
  TABLE_OWNER: string
  TABLE_NAME: string
  TABLE_TYPE: string
  UNIQUENESS: 'NONUNIQUE' | 'UNIQUE'
  TABLESPACE_NAME: string | null
  STATUS: string
  GENERATED: YN
  PARTITIONED: YesNo
  VISIBILITY: 'INVISIBLE' | 'VISIBLE'
  COMPRESSION: string | null
}

interface AllIndColumns {
  INDEX_OWNER: string
  INDEX_NAME: string
  TABLE_OWNER: string
  TABLE_NAME: string
  COLUMN_NAME: string
  COLUMN_POSITION: number
  DESCEND: 'ASC' | 'DESC'
}

interface AllIndExpressions {
  INDEX_OWNER: string
  INDEX_NAME: string
  TABLE_OWNER: string
  TABLE_NAME: string
  /** A LONG, which no SQL function takes. */
  COLUMN_EXPRESSION: string | null
  COLUMN_POSITION: number
}

interface AllTriggers {
  OWNER: string
  TRIGGER_NAME: string
  TRIGGER_TYPE: string
  TRIGGERING_EVENT: string
  TABLE_OWNER: string | null
  BASE_OBJECT_TYPE: string
  TABLE_NAME: string | null
  COLUMN_NAME: string | null
  REFERENCING_NAMES: string
  WHEN_CLAUSE: string | null
  STATUS: 'DISABLED' | 'ENABLED'
  DESCRIPTION: string
  ACTION_TYPE: string
  /** A LONG, which no SQL function takes. */
  TRIGGER_BODY: string | null
}

interface AllProcedures {
  OWNER: string
  OBJECT_NAME: string
  PROCEDURE_NAME: string | null
  OBJECT_ID: number
  SUBPROGRAM_ID: number
  OBJECT_TYPE: string
  AGGREGATE: YesNo
  PIPELINED: YesNo
  DETERMINISTIC: YesNo
  AUTHID: 'CURRENT_USER' | 'DEFINER'
}

interface AllArguments {
  OWNER: string
  OBJECT_NAME: string
  PACKAGE_NAME: string | null
  OBJECT_ID: number
  SUBPROGRAM_ID: number
  ARGUMENT_NAME: string | null
  POSITION: number
  SEQUENCE: number
  DATA_LEVEL: number
  DATA_TYPE: string | null
  IN_OUT: 'IN' | 'IN/OUT' | 'OUT'
  DEFAULTED: YN
}

interface AllSource {
  OWNER: string
  NAME: string
  TYPE: string
  LINE: number
  TEXT: string | null
}

interface AllTabPrivs {
  GRANTOR: string
  GRANTEE: string
  TABLE_SCHEMA: string
  TABLE_NAME: string
  PRIVILEGE: string
  GRANTABLE: YesNo
  HIERARCHY: YesNo
  TYPE: string
}

interface ProductComponentVersion {
  PRODUCT: string
  VERSION: string
  STATUS: string
}
