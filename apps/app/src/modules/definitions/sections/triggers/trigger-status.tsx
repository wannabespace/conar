import { Switch } from '@tamery/ui/components/switch'

import { OptionField } from '~/components/option-field'

import type { SectionInspectorProps } from '../../components/inspector'
import { InspectorSection } from '../../components/inspector'
import type { TriggerItem } from './trigger-draft'
import { useToggle } from './use-toggle'

export const TriggerStatus = ({
  item,
  queryKey,
  run,
}: Pick<SectionInspectorProps<TriggerItem>, 'queryKey' | 'run'> & {
  item: TriggerItem
}) => {
  const toggle = useToggle({ queryKey, run })

  return (
    <InspectorSection title="Status">
      <OptionField
        htmlFor="trigger-enabled"
        title="Enabled"
        description="A disabled trigger stays defined but never fires."
      >
        <Switch
          id="trigger-enabled"
          size="sm"
          disabled={toggle.isPending}
          checked={item.enabled !== false}
          onCheckedChange={(enabled) => toggle.mutate({ enabled, item })}
        />
      </OptionField>
    </InspectorSection>
  )
}
