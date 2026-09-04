import { ScrollArea } from '@tamery/ui/components/scroll-area'
import { getRouteApi } from '@tanstack/react-router'

import type { DefinitionsSection } from '~/entities/connection/store'
import { openDefinitionsTab } from '~/entities/connection/store'

import { Constraints } from './-sections/constraints'
import { Enums } from './-sections/enums'
import { Functions } from './-sections/functions'
import { Indexes } from './-sections/indexes'
import { Policies } from './-sections/policies'
import { Triggers } from './-sections/triggers'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const SECTIONS = {
  constraints: Constraints,
  enums: Enums,
  functions: Functions,
  indexes: Indexes,
  policies: Policies,
  triggers: Triggers,
}

export const DefinitionsTab = ({
  section,
}: {
  section: DefinitionsSection
}) => {
  const { connectionResource } = useRouteContext()
  const Section = SECTIONS[section]

  return (
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <ScrollArea
      className="min-h-0 flex-1"
      onClick={() => openDefinitionsTab(connectionResource.id, section)}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col px-6 py-5">
        <Section />
      </div>
    </ScrollArea>
  )
}
