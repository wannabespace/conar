import type { ConnectionType } from '@tamery/shared/enums/connection-type'

export const SKIP_GENERATOR = 'skip-generator'
export const REFERENCE_GENERATOR = 'reference-generator'
export const ENUM_GENERATOR = 'enum-generator'
export const CUSTOM_GENERATOR = 'custom-generator'

export interface GeneratorDef {
  label: string
  category: string
  generate: () => unknown
}

export type GeneratorMap<D extends ConnectionType | '' = ''> = Record<
  D extends '' ? string : `${D}.${string}`,
  GeneratorDef
>

export interface GeneratorGroup {
  value: string
  items: string[]
}
