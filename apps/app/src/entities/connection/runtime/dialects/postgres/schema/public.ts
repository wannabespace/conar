/**
 * @name public
 * @type schema
 */
export interface Public {
  pg_type: PgType
  pg_enum: PgEnum
}

/**
 * @name pg_type
 * @type table
 */
interface PgType {
  oid: number
  typname: string
  typnamespace: number
  typowner: number
  typlen: number
  typbyval: boolean
  typtype: string
  typcategory: string
  typispreferred: boolean
  typisdefined: boolean
  typdelim: string
  typrelid: number
  typsubscript: string
  typelem: number
  typarray: number
  typinput: string
  typoutput: string
  typreceive: string
  typsend: string
  typmodin: string
  typmodout: string
  typanalyze: string
  typalign: string
  typstorage: string
  typnotnull: boolean
  typbasetype: number
  typtypmod: number
  typndims: number
  typcollation: number
  typdefaultbin: string | null
  typdefault: string | null
  typacl: string | null
}

/**
 * @name pg_enum
 * @type table
 */
interface PgEnum {
  oid: number
  enumtypid: number
  enumsortorder: number
  enumlabel: string
}
