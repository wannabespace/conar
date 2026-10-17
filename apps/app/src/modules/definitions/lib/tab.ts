import { uppercaseFirst } from '@tamery/shared/utils'

import { sectionAvailable } from '~/core/catalog/section-capabilities'
import type { DefinitionsSection } from '~/core/catalog/sections'
import { definitionsSectionType } from '~/core/catalog/sections'
import { definitionsTabId } from '~/core/tabs/ids'
import type { SchemaItem, TabKind } from '~/core/tabs/types'

import { getSectionMeta } from '../section-meta'

export interface DefinitionsParams {
  section: DefinitionsSection
}

export const definitionsTab: TabKind<DefinitionsParams> = {
  available: ({ section }, dialect) => sectionAvailable(section, dialect),
  icon: ({ section }) => getSectionMeta(section).icon,
  match: (id) => {
    const [kind, section, ...extra] = id.split(':')

    return kind === 'definitions' &&
      extra.length === 0 &&
      definitionsSectionType.allows(section)
      ? { section }
      : null
  },
  title: ({ section }) => uppercaseFirst(section),
  type: 'definitions',
}

export const definitionsSchemaItem = (
  section: DefinitionsSection
): SchemaItem => {
  const { icon, title } = getSectionMeta(section)

  return {
    available: (dialect) => sectionAvailable(section, dialect),
    icon,
    label: title,
    tabId: definitionsTabId(section),
  }
}
