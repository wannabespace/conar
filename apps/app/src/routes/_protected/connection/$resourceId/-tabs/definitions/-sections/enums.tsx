import {
  LayoutTable02Icon,
  LayoutThreeColumnIcon,
  LeftToRightListBulletIcon,
  LeftToRightListDashIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { Badge } from '@tamery/ui/components/badge'
import { CardContent, CardTitle } from '@tamery/ui/components/card'
import { CardMotion } from '@tamery/ui/components/card.motion'
import { HighlightText } from '@tamery/ui/components/custom/highlight'
import { SearchInput } from '@tamery/ui/components/custom/search-input'
import { cn } from '@tamery/ui/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'

import { resourceEnumsQueryOptions } from '~/entities/connection/queries'

import { DefinitionsEmptyState } from '../-components/empty-state'
import { DefinitionsGrid } from '../-components/grid'
import { DefinitionsHeader } from '../-components/header'
import { SchemaSelect } from '../-components/schema-select'
import { MOTION_BLOCK_PROPS } from '../-constants'
import { useDefinitionsState } from '../-hooks/use-definitions-state'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export const Enums = () => {
  const { connection, connectionResource } = useRouteContext()
  const { data: enums, isPending } = useQuery(
    resourceEnumsQueryOptions({ connectionResource })
  )
  const { schemas, selectedSchema, setSelectedSchema, search, setSearch } =
    useDefinitionsState({
      connectionResource,
    })

  const filteredEnums =
    enums
      ?.filter(
        (enumItem) =>
          enumItem.schema === selectedSchema &&
          (!search ||
            enumItem.name.toLowerCase().includes(search.toLowerCase()) ||
            enumItem.values.some((value) =>
              value.toLowerCase().includes(search.toLowerCase())
            ) ||
            (!!enumItem.metadata?.table &&
              enumItem.metadata.table
                .toLowerCase()
                .includes(search.toLowerCase())) ||
            (!!enumItem.metadata?.column &&
              enumItem.metadata.column
                .toLowerCase()
                .includes(search.toLowerCase())))
      )
      .map((enumItem) => ({
        ...enumItem,
        values: enumItem.values.filter((value) =>
          value.toLowerCase().includes(search.toLowerCase())
        ),
      })) ?? []

  return (
    <>
      <DefinitionsHeader>
        Enums
        {connection.type === ConnectionType.MySQL && ' & Sets'}
      </DefinitionsHeader>
      <div className="mb-4 flex items-center gap-2">
        <SearchInput
          placeholder="Search enums"
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />
        <SchemaSelect
          schemas={schemas}
          selectedSchema={selectedSchema}
          setSelectedSchema={setSelectedSchema}
        />
      </div>
      <DefinitionsGrid loading={isPending}>
        {filteredEnums.length === 0 && (
          <DefinitionsEmptyState
            title="No enums found"
            description="This schema doesn't have any enums defined yet."
          />
        )}

        {filteredEnums.map((enumItem) => (
          <CardMotion
            key={`${enumItem.schema}-${enumItem.name}-${enumItem.metadata?.table ?? ''}-${enumItem.metadata?.column ?? ''}`}
            layout
            {...MOTION_BLOCK_PROPS}
          >
            <CardContent className="px-4 py-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <HugeiconsIcon
                      icon={
                        enumItem.metadata?.isSet
                          ? LeftToRightListDashIcon
                          : LeftToRightListBulletIcon
                      }
                      strokeWidth={2}
                      className="text-primary size-4"
                    />
                    <HighlightText text={enumItem.name} match={search} />
                    <Badge variant="secondary" className="text-xs">
                      {enumItem.metadata?.isSet ? 'Set' : 'Enum'}
                    </Badge>
                  </CardTitle>
                  <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-sm">
                    {enumItem.metadata?.table && (
                      <>
                        <Badge variant="outline" className="text-xs">
                          <HugeiconsIcon
                            icon={LayoutTable02Icon}
                            strokeWidth={2}
                            className="size-3"
                          />
                          {enumItem.metadata.table}
                        </Badge>
                        {enumItem.metadata.column && (
                          <>
                            <span>on</span>
                            <Badge
                              variant="outline"
                              className="font-mono text-xs"
                            >
                              <HugeiconsIcon
                                icon={LayoutThreeColumnIcon}
                                strokeWidth={2}
                                className="size-3"
                              />
                              {enumItem.metadata.column}
                            </Badge>
                          </>
                        )}
                      </>
                    )}
                    <AnimatePresence initial={false} mode="popLayout">
                      {enumItem.values.map((value) => (
                        <HighlightText
                          key={value}
                          text={value}
                          match={search}
                          render={({ html, matched }) => (
                            <motion.div layout {...MOTION_BLOCK_PROPS}>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-xs',
                                  matched && 'border-primary/30 bg-primary/10'
                                )}
                              >
                                <span
                                  // oxlint-disable-next-line react/no-danger -- HighlightText markup is escaped
                                  dangerouslySetInnerHTML={{ __html: html }}
                                />
                              </Badge>
                            </motion.div>
                          )}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </CardContent>
          </CardMotion>
        ))}
      </DefinitionsGrid>
    </>
  )
}
