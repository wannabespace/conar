import { ConnectionType } from '@tamery/shared/enums/connection-type'

import type { DefinitionsSection } from './store/tabs/types'

export interface SectionCapabilities {
  create?: boolean
  drop?: boolean
  edit?: boolean
}

interface ConnectionCapabilities {
  cascade: boolean
  explain: boolean
  renameColumns: boolean
  schemas: boolean
  sections: Record<DefinitionsSection, SectionCapabilities | false>
}

const readOnly: SectionCapabilities = {}
const full: SectionCapabilities = { create: true, drop: true, edit: true }

const capabilities: Record<ConnectionType, ConnectionCapabilities> = {
  [ConnectionType.ClickHouse]: {
    cascade: false,
    explain: false,
    renameColumns: false,
    schemas: false,
    sections: {
      constraints: readOnly,
      enums: readOnly,
      functions: false,
      indexes: readOnly,
      policies: { drop: true },
      triggers: false,
    },
  },
  [ConnectionType.MSSQL]: {
    cascade: false,
    explain: false,
    renameColumns: true,
    schemas: true,
    sections: {
      constraints: full,
      enums: false,
      functions: full,
      indexes: full,
      policies: readOnly,
      triggers: full,
    },
  },
  [ConnectionType.MySQL]: {
    cascade: false,
    explain: true,
    renameColumns: true,
    schemas: true,
    sections: {
      constraints: full,
      enums: { edit: true },
      functions: full,
      indexes: full,
      policies: readOnly,
      triggers: full,
    },
  },
  [ConnectionType.Postgres]: {
    cascade: true,
    explain: true,
    renameColumns: true,
    schemas: true,
    sections: {
      constraints: full,
      enums: full,
      functions: full,
      indexes: full,
      policies: full,
      triggers: full,
    },
  },
}

export const capabilitiesOf = (type: ConnectionType) => capabilities[type]

export const sectionAvailable = (
  section: DefinitionsSection,
  type: ConnectionType
) => capabilities[type].sections[section] !== false

export const sectionCapabilitiesOf = (
  section: DefinitionsSection,
  type: ConnectionType
): SectionCapabilities => capabilities[type].sections[section] || readOnly
