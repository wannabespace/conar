import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible'

const Collapsible = ({ ...props }: CollapsiblePrimitive.Root.Props) => (
  <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
)

const CollapsibleTrigger = ({
  ...props
}: CollapsiblePrimitive.Trigger.Props) => (
  <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />
)

const CollapsibleContent = ({ ...props }: CollapsiblePrimitive.Panel.Props) => (
  <CollapsiblePrimitive.Panel data-slot="collapsible-content" {...props} />
)

export { Collapsible, CollapsibleContent, CollapsibleTrigger }
