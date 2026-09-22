import { matchesSearch } from '@tamery/shared/utils'
import { Switch } from '@tamery/ui/components/switch'
import { useAppForm } from '@tamery/ui/components/tanstack-form'
import { useStore } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { type } from 'arktype'
import { toast } from 'sonner'

import { grantPrivilegeQuery } from '~/entities/connection/queries/privileges/grant'
import type { privilegeType } from '~/entities/connection/queries/privileges/list'
import { resourcePrivilegesQueryOptions } from '~/entities/connection/queries/privileges/list'
import { revokePrivilegeQuery } from '~/entities/connection/queries/privileges/revoke'
import type { PrivilegeTarget } from '~/entities/connection/queries/privileges/shape'
import {
  ALL_TABLES,
  PRIVILEGE_TYPES,
} from '~/entities/connection/queries/privileges/shape'
import { queryClient } from '~/lib/query-client'

import {
  resetFields,
  SchemaField,
  SelectField,
  TextField,
} from '../-components/fields'
import type { SectionInspectorProps } from '../-components/inspector'
import {
  Inspector,
  InspectorOption,
  InspectorSection,
} from '../-components/inspector'
import { DefinitionsPage } from '../-components/page'
import { useDefinitionsState } from '../-hooks/use-definitions-state'
import { useFilter } from '../-hooks/use-filter'
import type { DefinitionsColumn } from '../-lib/columns'
import { labelColumn, textColumn } from '../-lib/columns'

type PrivilegeItem = typeof privilegeType.infer

const tableLabel = (table: string) =>
  table === ALL_TABLES ? 'All tables' : table

const privilegeSchema = type({
  grantee: type(/\S/u).configure({
    message: 'Name the account, as user@host.',
  }),
  table: type(/\S/u).configure({ message: 'Pick a table, or all of them.' }),
})

const PrivilegeInspector = ({
  can,
  item,
  onOpenChange,
  queryKey,
  relationNamesOf,
  run,
  schemas,
  selectedSchema,
}: SectionInspectorProps<PrivilegeItem>) => {
  const mutation = useMutation({
    mutationFn: (draft: PrivilegeTarget) =>
      run(grantPrivilegeQuery({ ...draft, grantee: draft.grantee.trim() })),
    onSuccess: async (_result, draft) => {
      await queryClient.invalidateQueries({ queryKey })
      toast.success(`Granted ${draft.privilege} to ${draft.grantee.trim()}`)
      onOpenChange(false)
    },
  })
  const form = useAppForm({
    defaultValues: {
      grantable: item?.grantable ?? false,
      grantee: item?.grantee ?? '',
      privilege: item?.privilege ?? PRIVILEGE_TYPES[0],
      schema: item?.schema ?? selectedSchema ?? '',
      table: item?.table ?? ALL_TABLES,
    } satisfies PrivilegeTarget,
    onSubmit: ({ value }) => {
      mutation.mutate(value)
    },
    validators: { onChange: privilegeSchema, onMount: privilegeSchema },
  })
  const draft = useStore(form.store, (state) => state.values)
  const readOnly = !!item || !can.create

  return (
    <Inspector
      canSave={!item}
      description={item ? item.grantee : draft.schema}
      form={form}
      item={item}
      mutation={mutation}
      noun="privilege"
      readOnly={readOnly}
      saveLabel="Grant privilege"
    >
      <InspectorSection
        title="General"
        description="A privilege lets an account run one kind of statement on a database or a table."
      >
        <form.AppField name="grantee">
          {() => (
            <TextField
              label="Account"
              autoFocus
              description="user@host. A bare user means any host."
              disabled={readOnly}
              placeholder="app@%"
            />
          )}
        </form.AppField>
        <form.AppField name="privilege">
          {() => (
            <SelectField
              label="Privilege"
              disabled={readOnly}
              options={item ? [item.privilege] : PRIVILEGE_TYPES}
              placeholder="Privilege"
            />
          )}
        </form.AppField>
      </InspectorSection>
      <InspectorSection
        title="Target"
        description="The database the privilege covers, and one table of it or all of them."
      >
        <form.AppField name="schema">
          {() => (
            <SchemaField
              disabled={readOnly}
              schemas={schemas}
              onChanged={() => resetFields(form, { table: ALL_TABLES })}
            />
          )}
        </form.AppField>
        <form.AppField name="table">
          {() => (
            <SelectField
              label="Table"
              disabled={readOnly}
              labelOf={tableLabel}
              options={
                item
                  ? [item.table]
                  : [ALL_TABLES, ...relationNamesOf(draft.schema, 'table')]
              }
              placeholder="Choose a table"
            />
          )}
        </form.AppField>
      </InspectorSection>
      <InspectorSection title="Options">
        <form.AppField name="grantable">
          {(field) => (
            <InspectorOption
              htmlFor="privilege-grantable"
              title="Can grant"
              description="The account may pass this privilege on to others."
            >
              <Switch
                id="privilege-grantable"
                size="sm"
                disabled={readOnly}
                checked={field.state.value}
                onCheckedChange={field.handleChange}
              />
            </InspectorOption>
          )}
        </form.AppField>
      </InspectorSection>
    </Inspector>
  )
}

const columns: DefinitionsColumn<PrivilegeItem>[] = [
  textColumn({
    header: 'Account',
    valueOf: (item: PrivilegeItem) => item.grantee,
    width: 'w-4/12',
  }),
  labelColumn({
    header: 'Privilege',
    labelOf: (item: PrivilegeItem) => item.privilege,
    width: 'w-3/12',
  }),
  textColumn({
    header: 'Table',
    valueOf: (item: PrivilegeItem) => tableLabel(item.table),
  }),
  labelColumn({
    align: 'end',
    header: 'Can grant',
    labelOf: (item: PrivilegeItem) => (item.grantable ? 'Yes' : 'No'),
    width: 'w-2/12',
  }),
]

const privilegeKey = (item: PrivilegeItem) =>
  JSON.stringify([item.grantee, item.table, item.privilege])

export const Privileges = () => {
  const state = useDefinitionsState({ section: 'privileges' })
  const { connectionResource, run, search, selectedSchema } = state
  const query = resourcePrivilegesQueryOptions({ connectionResource })
  const { data: privileges = [], isPending } = useQuery(query)
  const privilegeFilter = useFilter<string>(
    'All privileges',
    PRIVILEGE_TYPES.map((privilege) => ({
      label: privilege,
      value: privilege,
    }))
  )

  return (
    <DefinitionsPage
      columns={columns}
      dropItem={(item) => run(revokePrivilegeQuery(item))}
      Inspector={PrivilegeInspector}
      items={privileges.filter((item) => item.schema === selectedSchema)}
      keyOf={privilegeKey}
      loading={isPending}
      match={(item) =>
        privilegeFilter.matches(item.privilege) &&
        matchesSearch(search, item.grantee, item.table, item.privilege)
      }
      queryKey={query.queryKey}
      state={state}
      toolbar={privilegeFilter.control}
    />
  )
}
