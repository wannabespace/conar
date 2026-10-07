import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@tamery/ui/components/item'
import { cn } from '@tamery/ui/lib/utils'
import type { ReactNode } from 'react'

import { cardClass } from '~/components/card'

export const SettingsGroup = ({
  children,
  title,
}: {
  children: ReactNode
  title?: ReactNode
}) => (
  <section className="flex flex-col gap-2">
    {title && (
      <h2 className="text-muted-foreground px-3.5 text-xs font-medium">
        {title}
      </h2>
    )}
    <div className={cn(cardClass, 'flex flex-col overflow-hidden')}>
      {children}
    </div>
  </section>
)

/** `htmlFor`: makes the whole row the control's label, for a `Switch`; leave it out for a control that opens a popup. */
export const SettingsRow = ({
  children,
  description,
  htmlFor,
  title,
}: {
  children: ReactNode
  description?: ReactNode
  htmlFor?: string
  title: ReactNode
}) => (
  <Item
    size="sm"
    variant="grouped"
    // oxlint-disable-next-line jsx-a11y/label-has-associated-control -- Item renders the title and description into this label
    render={htmlFor ? <label htmlFor={htmlFor} /> : undefined}
  >
    <ItemContent>
      <ItemTitle>{title}</ItemTitle>
      {description && <ItemDescription>{description}</ItemDescription>}
    </ItemContent>
    <ItemActions>{children}</ItemActions>
  </Item>
)
