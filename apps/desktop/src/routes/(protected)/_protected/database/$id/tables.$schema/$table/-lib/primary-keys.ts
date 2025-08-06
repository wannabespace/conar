/**
 * Utility functions for working with primary keys in table selection
 */

/**
 * Extract primary key object from a row
 */
export function extractPrimaryKey(row: Record<string, unknown>, primaryKeys: string[]): Record<string, unknown> {
  return primaryKeys.reduce((acc, key) => {
    acc[key] = row[key]
    return acc
  }, {} as Record<string, unknown>)
}

/**
 * Check if two primary key objects are equal
 */
export function arePrimaryKeysEqual(pk1: Record<string, unknown>, pk2: Record<string, unknown>): boolean {
  const keys1 = Object.keys(pk1)
  const keys2 = Object.keys(pk2)
  
  if (keys1.length !== keys2.length) {
    return false
  }
  
  return keys1.every(key => pk1[key] === pk2[key])
}

/**
 * Find row index from primary key object
 */
export function findRowIndexByPrimaryKey(
  rows: Record<string, unknown>[],
  primaryKey: Record<string, unknown>,
  primaryKeys: string[]
): number {
  return rows.findIndex(row => {
    const rowPk = extractPrimaryKey(row, primaryKeys)
    return arePrimaryKeysEqual(rowPk, primaryKey)
  })
}

/**
 * Check if a primary key is in a list of selected primary keys
 */
export function isPrimaryKeySelected(
  primaryKey: Record<string, unknown>,
  selectedPrimaryKeys: Record<string, unknown>[]
): boolean {
  return selectedPrimaryKeys.some(selected => arePrimaryKeysEqual(selected, primaryKey))
}

/**
 * Add a primary key to the selected list if not already present
 */
export function addPrimaryKeyToSelection(
  selectedPrimaryKeys: Record<string, unknown>[],
  primaryKey: Record<string, unknown>
): Record<string, unknown>[] {
  if (isPrimaryKeySelected(primaryKey, selectedPrimaryKeys)) {
    return selectedPrimaryKeys
  }
  return [...selectedPrimaryKeys, primaryKey]
}

/**
 * Remove a primary key from the selected list
 */
export function removePrimaryKeyFromSelection(
  selectedPrimaryKeys: Record<string, unknown>[],
  primaryKey: Record<string, unknown>
): Record<string, unknown>[] {
  return selectedPrimaryKeys.filter(selected => !arePrimaryKeysEqual(selected, primaryKey))
}