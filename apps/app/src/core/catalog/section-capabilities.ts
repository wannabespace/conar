import type { Dialect } from '@tamery/shared/enums/connection-type'

import { getCapabilities } from './capabilities'
import type { SectionCapabilities } from './capability-presets'
import { readOnly } from './capability-presets'
import type { DefinitionsSection } from './sections'

export const sectionAvailable = (
  section: DefinitionsSection,
  dialect: Dialect
) => getCapabilities(dialect).sections[section] !== false

export const getSectionCapabilities = (
  section: DefinitionsSection,
  dialect: Dialect
): SectionCapabilities => getCapabilities(dialect).sections[section] || readOnly

export const foreignKeysCreatable = (dialect: Dialect) =>
  getCapabilities(dialect).constraintKinds.includes('foreignKey') &&
  !!getSectionCapabilities('constraints', dialect).create
