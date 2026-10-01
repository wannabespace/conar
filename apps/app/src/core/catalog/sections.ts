import { type } from 'arktype'

export const definitionsSectionType = type(
  "'enums' | 'constraints' | 'indexes' | 'policies' | 'privileges' | 'triggers' | 'functions'"
)

export type DefinitionsSection = typeof definitionsSectionType.infer
