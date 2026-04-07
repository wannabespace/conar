export { getDisplayValue } from './base'
export { createTransformer } from './create-transformer'

export interface ValueTransformer {
  toEditable: (value: unknown) => string
  toDb: (editedValue: string) => string | string[]
}
