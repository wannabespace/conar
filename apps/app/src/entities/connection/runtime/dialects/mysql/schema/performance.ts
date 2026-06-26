/**
 * @name performance_schema
 * @type schema
 */
export interface PerformanceSchema {
  global_variables: GlobalVariables
}

/**
 * @name global_variables
 * @type table
 */
interface GlobalVariables {
  VARIABLE_NAME: string
  VARIABLE_VALUE: string
}
