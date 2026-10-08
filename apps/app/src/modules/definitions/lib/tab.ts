import { SecurityCheckIcon } from '@hugeicons/core-free-icons'
import { uppercaseFirst } from '@tamery/shared/utils'

import { sectionAvailable } from '~/core/catalog/capabilities'
import type { DefinitionsSection } from '~/core/catalog/sections'
import { definitionsSectionType } from '~/core/catalog/sections'
import { definitionsTabId } from '~/core/tabs/ids'
import type { SchemaItem, TabKind } from '~/core/tabs/types'

import { sectionMetaOf } from '../section-meta'

export interface DefinitionsParams {
  section: DefinitionsSection
}

export const definitionsTab: TabKind<DefinitionsParams> = {
  available: ({ section }, connectionType) =>
    sectionAvailable(section, connectionType),
  icon: SecurityCheckIcon,
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

const SECTION_GROUPS: [DefinitionsSection, SchemaItem['group']][] = [
  ['indexes', 'Structure'],
  ['constraints', 'Structure'],
  ['enums', 'Types'],
  ['functions', 'Logic'],
  ['triggers', 'Logic'],
  ['policies', 'Security'],
  ['privileges', 'Security'],
]

export const definitionsSchemaItems = SECTION_GROUPS.map(
  ([section, group]): SchemaItem => {
    const { icon, title } = sectionMetaOf(section)

    return {
      available: (connectionType) => sectionAvailable(section, connectionType),
      group,
      icon,
      label: title,
      tabId: definitionsTabId(section),
    }
  }
)
