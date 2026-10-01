import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { uppercaseFirst } from '@tamery/shared/utils'
import { type } from 'arktype'

import { capabilitiesOf } from '~/core/catalog/capabilities'
import type { triggersType } from '~/core/queries/triggers/list'
import type {
  TriggerEvent,
  TriggerOrientation,
  TriggerShape,
  TriggerTiming,
} from '~/core/queries/triggers/shape'
import {
  TRIGGER_EVENTS,
  TRIGGER_TIMINGS,
  triggerBodyTemplates,
} from '~/core/queries/triggers/shape'

export type TriggerItem = typeof triggersType.infer

export const sentenceCase = (value: string) =>
  uppercaseFirst(value.toLowerCase())

export interface TriggerDraft {
  body: string
  events: TriggerEvent[]
  functionName: string
  functionSchema: string
  name: string
  orientation: TriggerOrientation
  schema: string
  table: string
  timing: TriggerTiming
}

const triggerSchemaOf = (usesBody: boolean) =>
  type({
    body: 'string',
    events: type('string[] >= 1').configure({
      message: 'Pick at least one event.',
    }),
    functionName: 'string',
    name: type(/\S/u).configure({ message: 'Give the trigger a name.' }),
    table: type(/\S/u).configure({ message: 'Pick the table to watch.' }),
  }).narrow((draft, ctx) => {
    if (usesBody) {
      return (
        /\S/u.test(draft.body) ||
        ctx.reject({
          message: 'Write what the trigger runs.',
          relativePath: ['body'],
        })
      )
    }

    return (
      draft.functionName !== '' ||
      ctx.reject({
        message: 'Pick the function to run.',
        relativePath: ['functionName'],
      })
    )
  })

export const triggerSchemas = {
  body: triggerSchemaOf(true),
  function: triggerSchemaOf(false),
}

export const draftOf = (
  item: TriggerItem | null,
  pageSchema: string,
  connectionType: ConnectionType
): TriggerDraft => {
  const { orientations, timings } = capabilitiesOf(connectionType).triggers

  return {
    body: item?.body || triggerBodyTemplates[connectionType] || '',
    events: item
      ? TRIGGER_EVENTS.filter((event) => item.event.includes(event))
      : ['INSERT'],
    functionName: item?.functionName ?? '',
    functionSchema: item?.functionSchema ?? '',
    name: item?.name ?? '',
    orientation: item?.orientation ?? orientations[0] ?? 'ROW',
    schema: item?.schema ?? pageSchema,
    table: item?.table ?? '',
    timing:
      TRIGGER_TIMINGS.find((timing) => timing === item?.timing) ??
      timings[0] ??
      'AFTER',
  }
}

// A trigger carrying a WHEN clause, a column list, function arguments, an
// order or a constraint cannot be rebuilt from these fields.
export const formEditable = (item: TriggerItem, body: boolean) =>
  !item.custom && (!body || !!item.body)

export const shapeOf = (draft: TriggerDraft): TriggerShape => ({
  body: draft.body,
  events: draft.events,
  functionName: draft.functionName,
  functionSchema: draft.functionSchema || draft.schema,
  name: draft.name.trim(),
  orientation: draft.orientation,
  timing: draft.timing,
})
