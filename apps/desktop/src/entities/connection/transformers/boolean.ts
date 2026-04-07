import type { ValueTransformer } from './'

export function createBooleanTransformer(): ValueTransformer {
  return {
    toEditable(value: unknown) {
      if (value === null || value === undefined)
        return ''
      if (typeof value === 'boolean')
        return value.toString()
      if (value === 0 || value === 1)
        return (!!value).toString()
      return String(value)
    },

    toDb(editedValue: string) {
      return editedValue
    },
  }
}
