import {
  ArrowRight01Icon,
  Cancel01Icon,
  Delete02Icon,
  FocusPointIcon,
  Key01Icon,
  Link01Icon,
  PlusSignIcon,
  Undo02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { NumberFlow } from '@tamery/ui/components/custom/number-flow'
import { Skeleton } from '@tamery/ui/components/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { AppContextMenu, AppMenuButton } from '~/components/app-context-menu'
import type { AppMenuNode } from '~/components/app-menu'
import { Link } from '~/components/link'
import type { indexesType } from '~/entities/connection/queries/indexes/list'
import type { policyType } from '~/entities/connection/queries/policies/list'
import { resourceTableTotalQueryOptions } from '~/entities/connection/queries/rows/total'
import type { triggersType } from '~/entities/connection/queries/triggers/list'
import { openDefinitionsTab } from '~/entities/connection/store/helpers/tabs'
import { definitionsTabId } from '~/entities/connection/store/tabs/ids'
import type { DefinitionsSection } from '~/entities/connection/store/tabs/types'

import { useDiagram } from '../-lib/context'
import type { DiagramColumn, DiagramTable } from '../-lib/schema'
import { columnMenu, draftStateClass, tableMenu } from './table-node'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const noFilters: never[] = []

const Section = ({
  action,
  children,
  title,
}: {
  action?: ReactNode
  children: ReactNode
  title: string
}) => (
  <section className="flex flex-col gap-1.5">
    <div className="flex h-6 items-center justify-between">
      <h3 className="text-2xs text-muted-foreground font-semibold tracking-wider uppercase">
        {title}
      </h3>
      {action}
    </div>
    {children}
  </section>
)

const List = ({ children }: { children: ReactNode }) => (
  <ul className="bg-popover ring-foreground/4 flex flex-col overflow-hidden rounded-xl text-xs shadow-xs ring">
    {children}
  </ul>
)

const rowClass =
  'border-foreground/6 hover:bg-accent flex h-7 items-center gap-2 border-b pr-1 pl-3 last:border-b-0'

const EmptyRow = ({ children }: { children: string }) => (
  <li className="text-muted-foreground flex h-7 items-center px-3">
    {children}
  </li>
)

const ColumnItem = ({
  column,
  table,
}: {
  column: DiagramColumn
  table: DiagramTable
}) => {
  const { actions, can, diagram, view } = useDiagram()
  const hoverRelation = (hoveredRelationId: string | null) =>
    view.set((state) => ({ ...state, hoveredRelationId }))
  const relation = diagram.relations.find(
    ({ source, target }) =>
      (source.table === table.id && source.column === column.id) ||
      (target.table === table.id && target.column === column.id)
  )
  const menu = () => columnMenu(table, column, can, actions)

  return (
    <AppContextMenu
      items={menu}
      render={
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <li
          className={cn(
            rowClass,
            column.state && draftStateClass[column.state]
          )}
          onMouseEnter={() => hoverRelation(relation?.id ?? null)}
          onMouseLeave={() => hoverRelation(null)}
        />
      }
    >
      {column.primaryKey && (
        <HugeiconsIcon
          icon={Key01Icon}
          strokeWidth={2}
          className="text-primary size-3 shrink-0"
        />
      )}
      {!column.primaryKey && column.foreign && (
        <HugeiconsIcon
          icon={Link01Icon}
          strokeWidth={2}
          className="text-muted-foreground/70 size-3 shrink-0"
        />
      )}
      <span data-mask className="min-w-0 flex-1 truncate font-mono">
        {column.name}
      </span>
      <span
        data-mask
        className="text-muted-foreground max-w-[40%] truncate font-mono"
      >
        {column.type}
        {column.nullable && '?'}
      </span>
      {table.kind === 'table' && (
        <AppMenuButton
          items={menu}
          render={<Button variant="ghost" size="icon-xs" />}
        />
      )}
    </AppContextMenu>
  )
}

const DefinitionLink = ({
  children,
  rowKey,
  schema,
  section,
}: {
  children: ReactNode
  rowKey: unknown[]
  schema: string
  section: DefinitionsSection
}) => {
  const { connectionResource } = useRouteContext()

  return (
    <li>
      <Link
        to="/connection/$resourceId/$tabId"
        params={{
          resourceId: connectionResource.id,
          tabId: definitionsTabId(section),
        }}
        search={{ open: JSON.stringify(rowKey), schema }}
        onClick={() => openDefinitionsTab(connectionResource.id, section)}
        className={cn(rowClass, 'text-foreground group/link pr-2')}
      >
        {children}
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          strokeWidth={2}
          className="text-muted-foreground/50 group-hover/link:text-muted-foreground size-3 shrink-0"
        />
      </Link>
    </li>
  )
}

const RowCount = ({ table }: { table: DiagramTable }) => {
  const { connectionResource } = useRouteContext()
  const { data, isPending } = useQuery({
    ...resourceTableTotalQueryOptions({
      connectionResource,
      query: { exact: false, filters: noFilters },
      schema: table.schema,
      table: table.table,
    }),
    enabled: table.state !== 'added',
  })

  if (table.state === 'added') {
    return null
  }

  return (
    <span className="text-muted-foreground flex items-center gap-1 text-xs tabular-nums">
      {isPending || !data ? (
        <Skeleton className="h-3 w-12" />
      ) : (
        <>
          {data.isEstimated && '~'}
          <NumberFlow value={data.count} />
        </>
      )}{' '}
      rows
    </span>
  )
}

export const Inspector = ({
  indexes,
  onClose,
  policies,
  table,
  triggers,
}: {
  indexes: (typeof indexesType.infer)[]
  onClose: () => void
  policies: (typeof policyType.infer)[]
  table: DiagramTable
  triggers: (typeof triggersType.infer)[]
}) => {
  const { actions, can, diagram, view } = useDiagram()
  const hoverRelation = (hoveredRelationId: string | null) =>
    view.set((state) => ({ ...state, hoveredRelationId }))
  const editable = table.kind === 'table' && table.state !== 'dropped'
  const ofTable = <T extends { schema: string; table: string }>(items: T[]) =>
    items.filter(
      (item) => item.schema === table.schema && item.table === table.table
    )
  const relations = diagram.relations.filter(
    (relation) =>
      relation.source.table === table.id || relation.target.table === table.id
  )
  const nameOf = (id: string) =>
    diagram.tables.find((entry) => entry.id === id)?.name ?? id
  const menuOfTable = () => tableMenu(table, can, actions)

  return (
    <div className="flex h-full flex-col">
      <AppContextMenu
        items={menuOfTable}
        render={
          <header className="flex h-11 shrink-0 items-center gap-1 pr-2 pl-4" />
        }
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <span
            data-mask
            className={cn(
              'truncate text-sm font-medium',
              table.state === 'dropped' && 'line-through'
            )}
          >
            {table.name}
          </span>
          <span data-mask className="text-2xs text-muted-foreground truncate">
            {table.kind} · {table.schema}
          </span>
        </div>
        <RowCount table={table} />
        <AppMenuButton
          items={menuOfTable}
          render={<Button variant="ghost" size="icon-xs" />}
        />
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Close inspector"
                className="text-muted-foreground"
                onClick={onClose}
              />
            }
          >
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
          </TooltipTrigger>
          <TooltipContent side="bottom">Close</TooltipContent>
        </Tooltip>
      </AppContextMenu>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
        <Section
          title="Columns"
          action={
            editable && (
              <Button
                variant="ghost"
                size="xs"
                className="text-muted-foreground"
                onClick={() => actions.addColumn(table)}
              >
                <HugeiconsIcon
                  icon={PlusSignIcon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                Add
              </Button>
            )
          }
        >
          <List>
            {table.columns.map((column) => (
              <ColumnItem key={column.id} column={column} table={table} />
            ))}
            {table.columns.length === 0 && <EmptyRow>No columns yet</EmptyRow>}
          </List>
        </Section>
        <Section title="Relations">
          <List>
            {relations.map((relation) => {
              const outgoing = relation.source.table === table.id
              const menu: AppMenuNode[] | null =
                outgoing && can.dropForeignKeys
                  ? [
                      relation.state === 'dropped'
                        ? {
                            icon: Undo02Icon,
                            label: 'Restore Foreign Key',
                            onSelect: () => actions.dropRelation(relation),
                          }
                        : {
                            icon: Delete02Icon,
                            label: 'Drop Foreign Key',
                            onSelect: () => actions.dropRelation(relation),
                            variant: 'destructive',
                          },
                    ]
                  : null
              const rowProps = {
                className: cn(
                  rowClass,
                  relation.state && draftStateClass[relation.state]
                ),
                onMouseEnter: () => hoverRelation(relation.id),
                onMouseLeave: () => hoverRelation(null),
              }
              const content = (
                <>
                  <span data-mask className="min-w-0 flex-1 truncate font-mono">
                    {outgoing ? relation.source.column : relation.target.column}
                    <span className="text-muted-foreground/60">
                      {outgoing ? ' → ' : ' ← '}
                    </span>
                    {nameOf(
                      outgoing ? relation.target.table : relation.source.table
                    )}
                    .
                    {outgoing ? relation.target.column : relation.source.column}
                  </span>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Show relation on canvas"
                          className="text-muted-foreground"
                          onClick={() => actions.focusRelation(relation)}
                        />
                      }
                    >
                      <HugeiconsIcon icon={FocusPointIcon} strokeWidth={2} />
                    </TooltipTrigger>
                    <TooltipContent side="left">Show on canvas</TooltipContent>
                  </Tooltip>
                  {menu && (
                    <AppMenuButton
                      items={menu}
                      render={<Button variant="ghost" size="icon-xs" />}
                    />
                  )}
                </>
              )

              return menu ? (
                <AppContextMenu
                  key={relation.id}
                  items={menu}
                  render={<li {...rowProps} />}
                >
                  {content}
                </AppContextMenu>
              ) : (
                <li key={relation.id} {...rowProps}>
                  {content}
                </li>
              )
            })}
            {relations.length === 0 && (
              <EmptyRow>
                {can.foreignKeys
                  ? 'Drag a column onto a key to link tables'
                  : 'No relations'}
              </EmptyRow>
            )}
          </List>
        </Section>
        {can.indexes && (
          <Section title="Indexes">
            <List>
              {ofTable(indexes).map((index) => (
                <DefinitionLink
                  key={index.name}
                  rowKey={[index.table, index.name]}
                  schema={table.schema}
                  section="indexes"
                >
                  <span data-mask className="min-w-0 flex-1 truncate font-mono">
                    {index.name}
                  </span>
                  <span className="text-muted-foreground shrink-0">
                    {index.isPrimary ? 'primary' : index.isUnique && 'unique'}
                  </span>
                </DefinitionLink>
              ))}
              {ofTable(indexes).length === 0 && <EmptyRow>No indexes</EmptyRow>}
            </List>
          </Section>
        )}
        {can.triggers && (
          <Section title="Triggers">
            <List>
              {ofTable(triggers).map((trigger) => (
                <DefinitionLink
                  key={`${trigger.name}:${trigger.event}`}
                  rowKey={[
                    trigger.schema,
                    trigger.table,
                    trigger.name,
                    trigger.event,
                  ]}
                  schema={table.schema}
                  section="triggers"
                >
                  <span data-mask className="min-w-0 flex-1 truncate font-mono">
                    {trigger.name}
                  </span>
                  <span className="text-muted-foreground shrink-0">
                    {trigger.timing.toLowerCase()} {trigger.event.toLowerCase()}
                  </span>
                </DefinitionLink>
              ))}
              {ofTable(triggers).length === 0 && (
                <EmptyRow>No triggers</EmptyRow>
              )}
            </List>
          </Section>
        )}
        {can.policies && (
          <Section title="Policies">
            <List>
              {ofTable(policies).map((policy) => (
                <DefinitionLink
                  key={policy.name}
                  rowKey={[policy.table, policy.name]}
                  schema={table.schema}
                  section="policies"
                >
                  <span data-mask className="min-w-0 flex-1 truncate font-mono">
                    {policy.name}
                  </span>
                  <span className="text-muted-foreground shrink-0">
                    {policy.command.toLowerCase()}
                  </span>
                </DefinitionLink>
              ))}
              {ofTable(policies).length === 0 && (
                <EmptyRow>No policies</EmptyRow>
              )}
            </List>
          </Section>
        )}
      </div>
    </div>
  )
}
