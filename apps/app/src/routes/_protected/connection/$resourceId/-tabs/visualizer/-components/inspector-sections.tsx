import { ArrowRight01Icon, FocusPointIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { getRouteApi } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { AppContextMenu, AppMenuButton } from '~/components/app-context-menu'
import { Link } from '~/components/link'
import type { indexesType } from '~/entities/connection/queries/indexes/list'
import type { policyType } from '~/entities/connection/queries/policies/list'
import type { triggersType } from '~/entities/connection/queries/triggers/list'
import { openDefinitionsTab } from '~/entities/connection/store/helpers/tabs'
import { definitionsTabId } from '~/entities/connection/store/tabs/ids'
import type { DefinitionsSection } from '~/entities/connection/store/tabs/types'

import { useDiagram } from '../-lib/context'
import type { DiagramTable } from '../-lib/schema'
import { relationMenu } from './menus'
import { draftStateClass } from './table-node'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export const Section = ({
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

export const List = ({ children }: { children: ReactNode }) => (
  <ul className="bg-popover ring-foreground/4 flex flex-col overflow-hidden rounded-xl text-xs shadow-xs ring">
    {children}
  </ul>
)

export const rowClass =
  'border-foreground/6 hover:bg-accent flex h-7 items-center gap-2 border-b pr-1 pl-3 last:border-b-0'

export const EmptyRow = ({ children }: { children: string }) => (
  <li className="text-muted-foreground flex h-7 items-center px-3">
    {children}
  </li>
)

export const RelationsSection = ({ table }: { table: DiagramTable }) => {
  const { actions, can, diagram, view } = useDiagram()
  const hoverRelation = (hoveredRelationId: string | null) =>
    view.set((state) => ({ ...state, hoveredRelationId }))
  const relations = diagram.relations.filter(
    (relation) =>
      relation.source.table === table.id || relation.target.table === table.id
  )
  const nameOf = (id: string) =>
    diagram.tables.find((entry) => entry.id === id)?.name ?? id

  return (
    <Section title="Relations">
      <List>
        {relations.map((relation) => {
          const outgoing = relation.source.table === table.id
          const menu =
            outgoing && can.dropForeignKeys
              ? relationMenu(relation, actions)
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
                .{outgoing ? relation.target.column : relation.source.column}
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

export const DefinitionsSections = ({
  indexes,
  policies,
  table,
  triggers,
}: {
  indexes: (typeof indexesType.infer)[]
  policies: (typeof policyType.infer)[]
  table: DiagramTable
  triggers: (typeof triggersType.infer)[]
}) => {
  const { can } = useDiagram()
  const ofTable = <T extends { schema: string; table: string }>(items: T[]) =>
    items.filter(
      (item) => item.schema === table.schema && item.table === table.table
    )

  return (
    <>
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
            {ofTable(triggers).length === 0 && <EmptyRow>No triggers</EmptyRow>}
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
            {ofTable(policies).length === 0 && <EmptyRow>No policies</EmptyRow>}
          </List>
        </Section>
      )}
    </>
  )
}
