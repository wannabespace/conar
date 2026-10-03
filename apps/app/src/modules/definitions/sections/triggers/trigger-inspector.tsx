import { sqlLanguageIds } from '@tamery/monaco/sql-language'
import { sameShape } from '@tamery/shared/utils'
import { Switch } from '@tamery/ui/components/switch'
import { useAppForm } from '@tamery/ui/components/tanstack-form'
import { useStore } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { capabilitiesOf } from '~/core/catalog/capabilities'
import { resourceFunctionsQueryOptions } from '~/core/queries/functions/list'
import { createTriggerQuery } from '~/core/queries/triggers/create'
import { triggerDefinitionQueryOptions } from '~/core/queries/triggers/definition'
import { recreateTriggerQuery } from '~/core/queries/triggers/recreate'
import type { TriggerEvent, TriggerTiming } from '~/core/queries/triggers/shape'
import {
  triggerEventsFor,
  triggerOrientationsFor,
} from '~/core/queries/triggers/shape'
import { usePermissions } from '~/core/user/permissions'
import { queryClient } from '~/lib/query-client'

import {
  BodyField,
  Labelled,
  OptionSelect,
  OptionsField,
  resetFields,
  SchemaField,
  SelectField,
  TextField,
} from '../../components/fields'
import type { SectionInspectorProps } from '../../components/inspector'
import {
  Inspector,
  InspectorOption,
  InspectorSection,
  InspectorSql,
  replaceWarning,
} from '../../components/inspector'
import type { TriggerDraft, TriggerItem } from './trigger-draft'
import {
  draftOf,
  formEditable,
  sentenceCase,
  shapeOf,
  triggerSchemas,
} from './trigger-draft'
import { useToggle } from './use-toggle'

export const TriggerInspector = ({
  can,
  connectionResource,
  item,
  relationNamesOf,
  onOpenChange,
  queryKey,
  run,
  schemas,
  selectedSchema,
  type: connectionType,
}: SectionInspectorProps<TriggerItem>) => {
  const canEdit = usePermissions().check('database.edit')
  const options = capabilitiesOf(connectionType).triggers
  const { data: functions = [], isPending: functionsPending } = useQuery({
    ...resourceFunctionsQueryOptions({ connectionResource }),
    enabled: !options.body,
  })
  const toggle = useToggle({ queryKey, run })
  const mutation = useMutation({
    mutationFn: (draft: TriggerDraft) =>
      run(
        item
          ? recreateTriggerQuery({
              enabled: item.enabled,
              mode: item.enabledMode,
              name: item.name,
              schema: item.schema,
              shape: shapeOf(draft),
              table: item.table,
            })
          : createTriggerQuery({
              schema: draft.schema,
              shape: shapeOf(draft),
              table: draft.table,
            })
      ),
    onSuccess: async (_result, draft) => {
      await queryClient.invalidateQueries({ queryKey })
      toast.success(
        `Trigger "${draft.name.trim()}" ${item ? 'saved' : 'created'}`
      )
      onOpenChange(false)
    },
  })
  const schema = triggerSchemas[options.body ? 'body' : 'function']
  const form = useAppForm({
    defaultValues: draftOf(item, selectedSchema ?? '', connectionType),
    onSubmit: ({ value }) => {
      // The picker narrows the orientation, and a hidden one still has to be legal.
      const allowed = triggerOrientationsFor(value, options.orientations)

      mutation.mutate(
        allowed.includes(value.orientation)
          ? value
          : { ...value, orientation: allowed[0] ?? value.orientation }
      )
    },
    validators: { onChange: schema, onMount: schema },
  })
  const draft = useStore(form.store, (state) => state.values)

  const readOnly = item
    ? !can.edit || !formEditable(item, options.body)
    : !can.create
  const orientations = triggerOrientationsFor(draft, options.orientations)
  const instead = draft.timing === 'INSTEAD OF'
  const targetsFor = (timing: TriggerTiming) => {
    if (item) {
      return [item.table]
    }

    if (timing !== 'INSTEAD OF') {
      return relationNamesOf(draft.schema, 'table')
    }

    return options.insteadOfTargets.flatMap((target) =>
      relationNamesOf(draft.schema, target)
    )
  }
  const targets = targetsFor(draft.timing)
  const saved = item && shapeOf(draftOf(item, draft.schema, connectionType))
  const changed = !saved || !sameShape(shapeOf(draft), saved)

  return (
    <Inspector
      canSave={changed}
      description={item ? `${item.schema}.${item.table}` : draft.schema}
      form={form}
      item={item}
      mutation={mutation}
      noun="trigger"
      readOnly={readOnly}
      warning={
        item
          ? replaceWarning({ connectionType, name: item.name, noun: 'trigger' })
          : undefined
      }
    >
      {item && options.toggle && (
        <InspectorSection title="Status">
          <InspectorOption
            htmlFor="trigger-enabled"
            title="Enabled"
            description="A disabled trigger stays defined but never fires."
          >
            <Switch
              id="trigger-enabled"
              size="sm"
              disabled={toggle.isPending || !canEdit}
              data-guest-locked={canEdit ? undefined : 'edit'}
              checked={item.enabled !== false}
              onCheckedChange={(enabled) => toggle.mutate({ enabled, item })}
            />
          </InspectorOption>
        </InspectorSection>
      )}
      <InspectorSection
        title="General"
        description="A trigger runs whenever its table changes."
      >
        <form.AppField name="schema">
          {() => (
            <SchemaField
              disabled={readOnly || !!item}
              schemas={schemas}
              onChanged={() =>
                resetFields(form, { functionName: '', table: '' })
              }
            />
          )}
        </form.AppField>
        <form.AppField name="name">
          {() => <TextField label="Name" autoFocus disabled={readOnly} />}
        </form.AppField>
        <form.AppField name="table">
          {() => (
            <SelectField
              label={instead ? 'View' : 'Table'}
              description={
                instead
                  ? 'An instead-of trigger stands in for writes to a view.'
                  : 'The trigger watches changes on this table.'
              }
              disabled={readOnly || !!item}
              empty={`This schema has no ${instead ? 'views' : 'tables'}.`}
              options={targets}
              placeholder={`Choose a ${instead ? 'view' : 'table'}`}
            />
          )}
        </form.AppField>
      </InspectorSection>
      <InspectorSection
        title="Firing"
        description="Which changes wake the trigger, and when it runs."
      >
        <form.AppField name="events">
          {(field) =>
            options.multipleEvents ? (
              <OptionsField
                label="Events"
                description="Only the events chosen here fire the trigger."
                disabled={readOnly}
                options={triggerEventsFor(draft.timing, options.events)}
                placeholder="Choose events"
              />
            ) : (
              <Labelled
                label="Event"
                description="A trigger here answers to a single event."
              >
                <OptionSelect
                  id={field.name}
                  disabled={readOnly}
                  options={triggerEventsFor(draft.timing, options.events)}
                  placeholder="Choose an event"
                  value={field.state.value[0] ?? ''}
                  onValueChange={(event: TriggerEvent) =>
                    field.handleChange([event])
                  }
                />
              </Labelled>
            )
          }
        </form.AppField>
        <div className="grid grid-cols-2 gap-3">
          <form.AppField name="timing">
            {() => (
              <SelectField
                label="Timing"
                disabled={readOnly}
                labelOf={sentenceCase}
                options={options.timings}
                placeholder="Timing"
                onChanged={(timing: TriggerTiming) =>
                  resetFields(form, {
                    events: triggerEventsFor(timing, draft.events),
                    ...(targetsFor(timing).includes(draft.table)
                      ? {}
                      : { table: '' }),
                  })
                }
              />
            )}
          </form.AppField>
          {orientations.length > 1 && (
            <form.AppField name="orientation">
              {() => (
                <SelectField
                  label="For each"
                  disabled={readOnly}
                  labelOf={sentenceCase}
                  options={orientations}
                  placeholder="For each"
                />
              )}
            </form.AppField>
          )}
        </div>
      </InspectorSection>
      <InspectorSection
        title="Action"
        description="What the database runs when the trigger fires."
      >
        {options.body ? (
          <form.AppField name="body">
            {() => (
              <BodyField
                label="Body"
                description="Runs for every change the trigger answers to."
                disabled={readOnly}
                language={sqlLanguageIds[connectionType]}
              />
            )}
          </form.AppField>
        ) : (
          <form.AppField name="functionName">
            {() => (
              <SelectField
                label="Function"
                description="Functions in this schema that return a trigger."
                disabled={readOnly}
                empty={
                  functionsPending
                    ? 'Loading…'
                    : 'No function here returns a trigger.'
                }
                options={functions
                  .filter(
                    (fn) =>
                      fn.schema === draft.schema && fn.return_type === 'trigger'
                  )
                  .map((fn) => fn.name)}
                placeholder="Choose a function"
                // The picker only offers this schema, so a pick moves the
                // function off the schema the opened trigger named.
                onChanged={() =>
                  resetFields(form, { functionSchema: draft.schema })
                }
              />
            )}
          </form.AppField>
        )}
      </InspectorSection>
      {item && (
        <InspectorSql
          query={triggerDefinitionQueryOptions({ connectionResource, item })}
        />
      )}
    </Inspector>
  )
}
