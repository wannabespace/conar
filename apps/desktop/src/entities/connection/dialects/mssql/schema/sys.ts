/**
 * @name sys
 * @type schema
 */
export interface Sys {
  indexes: Indexes
  tables: Tables
  schemas: Schemas
  index_columns: IndexColumns
  columns: Columns
  databases: Databases
}

/**
 * @name databases
 * @type table
 */
interface Databases {
  name: string
  database_id: number
  source_database_id: number | null
  owner_sid: string
  create_date: Date
  compatibility_level: number
  collation_name: string | null
  user_access: number
  user_access_desc: string | null
  is_read_only: boolean
  is_auto_shrink_on: boolean
  state: number
  state_desc: string | null
  is_in_standby: boolean
  is_cleanly_shutdown: boolean
  is_supplemental_logging_enabled: boolean
  snapshot_isolation_state: number
  snapshot_isolation_state_desc: string | null
  recovery_model: number
  recovery_model_desc: string | null
  page_verify_option: number
  page_verify_option_desc: string | null
  is_auto_create_stats_on: boolean
  is_auto_update_stats_on: boolean
  is_auto_update_stats_async_on: boolean
  is_ansi_null_default_on: boolean
  is_ansi_nulls_on: boolean
  is_ansi_padding_on: boolean
  is_ansi_warnings_on: boolean
  is_arithabort_on: boolean
  is_concat_null_yields_null_on: boolean
  is_numeric_roundabort_on: boolean
  is_quoted_identifier_on: boolean
  is_recursive_triggers_on: boolean
  is_cursor_close_on_commit_on: boolean
  is_local_cursor_default: boolean
  is_fulltext_enabled: boolean
  is_trustworthy_on: boolean
  is_db_chaining_on: boolean
  is_parameterization_forced: boolean
  is_master_key_encrypted_by_server: boolean
  is_query_store_on: boolean
  is_published: boolean
  is_subscribed: boolean
  is_merge_published: boolean
  is_distributor: boolean
  is_sync_with_backup: boolean
  service_broker_guid: string
  is_broker_enabled: boolean
  log_reuse_wait: number
  log_reuse_wait_desc: string | null
  is_date_correlation_on: boolean
  is_cdc_enabled: boolean
  is_encrypted: boolean
  is_honor_broker_priority_on: boolean
  replica_id: string | null
  group_database_id: string | null
  resource_pool_id: number | null
  default_language_lcid: number | null
  default_language_name: string | null
  default_fulltext_language_lcid: number | null
  default_fulltext_language_name: string | null
  is_nested_triggers_on: boolean | null
  is_transform_noise_words_on: boolean | null
  two_digit_year_cutoff: number | null
  containment: number | null
  containment_desc: string | null
  target_recovery_time_in_seconds: number | null
  delayed_durability: number | null
  delayed_durability_desc: string | null
  is_memory_optimized_elevate_to_snapshot_on: boolean | null
  is_federation_member: boolean | null
  is_remote_data_archive_enabled: boolean | null
  is_mixed_page_allocation_on: boolean | null
}

/**
 * @name indexes
 * @type table
 */
interface Indexes {
  object_id: number
  index_id: number
  name: string
  is_unique: boolean
  is_primary_key: boolean
}

/**
 * @name tables
 * @type table
 */
interface Tables {
  object_id: number
  schema_id: number
  name: string
}

/**
 * @name schemas
 * @type table
 */
interface Schemas {
  schema_id: number
  name: string
}

/**
 * @name index_columns
 * @type table
 */
interface IndexColumns {
  object_id: number
  index_id: number
  column_id: number
}

/**
 * @name columns
 * @type table
 */
interface Columns {
  object_id: number
  column_id: number
  name: string
}
