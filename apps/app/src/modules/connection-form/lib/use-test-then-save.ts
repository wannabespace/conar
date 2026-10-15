import { connectionParts } from '@tamery/connection/connection-parts'
import type { GuessFormat } from '@tamery/connection/guess'
import { describeConnectionString } from '@tamery/connection/utils'
import type { SqlDialect } from '@tamery/shared/enums/connection-type'
import { dialectOf } from '@tamery/shared/enums/connection-type'
import type { SyncType } from '@tamery/shared/enums/sync-type'
import { toError } from '@tamery/shared/utils'
import { useMutation } from '@tanstack/react-query'
import { Result } from 'better-result'
import { useRef } from 'react'
import { toast } from 'sonner'

import { fetchingConfig } from '~/core/connection/fetching-config'
import type { ConnectionDetails } from '~/core/connection/save'
import { testConnectionQuery } from '~/core/queries/connection/test'
import { useLocalProxyAvailable } from '~/core/runtime/proxy'
import { generateRandomName } from '~/utils/faker'

import type { ConnectionForm, ConnectionFormValues } from './connection-form'
import { partsOf } from './connection-form'
import type { FormMode } from './form-mode'

export type OnSave = (
  connection: ConnectionDetails,
  created: {
    open: boolean
    origin: GuessFormat | undefined
    syncType: SyncType
  }
) => Promise<unknown>

export const useTestThenSave = (mode: FormMode, onSave: OnSave) => {
  const isLocalProxyAvailable = useLocalProxyAvailable()
  const test = useMutation({
    meta: { event: 'connection_tested' },
    mutationFn: (params: { connectionString: string; type: SqlDialect }) =>
      testConnectionQuery.run(params),
  })
  const inFlight = useRef<Promise<Result<unknown, unknown>>>(null)

  const draftOf = (values: ConnectionFormValues) => {
    const connectionString = Result.try(() =>
      connectionParts.format(
        partsOf(values),
        mode.kind === 'edit' ? mode.missingSecrets : []
      )
    ).unwrapOr('')
    const described = Result.try(() =>
      describeConnectionString(connectionString)
    ).unwrapOr(null)
    const editing = described && mode.kind === 'edit' ? mode : null
    const { canSend, reason } = fetchingConfig(
      {
        isPasswordExists:
          !!described?.isPasswordPopulated || !!editing?.passwordElsewhere,
        syncType: values.syncType,
      },
      {
        connectionString: {
          displayUrl: described?.displayUrl ?? '',
          isPasswordPopulated: !!described?.isPasswordPopulated,
          missingSecrets: (editing && described?.missingSecrets) || [],
          usesSsh: values.sshEnabled,
        },
        isLocalProxyAvailable,
      }
    )
    const tested =
      test.variables?.connectionString === connectionString &&
      test.variables.type === dialectOf(values.type)
    return {
      canSend: canSend && !!connectionString,
      connectionString,
      reason,
      testStatus: tested ? test.status : 'idle',
    }
  }

  const runTest = (values: ConnectionFormValues) => {
    const { canSend, connectionString } = draftOf(values)
    if (!canSend) {
      return null
    }
    inFlight.current = Result.tryPromise(() =>
      test.mutateAsync({
        connectionString,
        type: dialectOf(values.type),
      })
    )
    return inFlight.current
  }

  const save = async (
    form: ConnectionForm,
    origin: GuessFormat | undefined
  ): Promise<void> => {
    const draft = draftOf(form.state.values)
    if (
      draft.canSend &&
      (draft.testStatus === 'idle' || draft.testStatus === 'pending')
    ) {
      const result = await (draft.testStatus === 'pending'
        ? inFlight.current
        : runTest(form.state.values))
      if (result?.isErr()) {
        return
      }
      if (
        draftOf(form.state.values).connectionString !== draft.connectionString
      ) {
        return save(form, origin)
      }
    }
    const { values } = form.state
    const { connectionString } = draft
    const saved = await Result.tryPromise(() => {
      if (!connectionString) {
        throw new Error("The host isn't a valid address.")
      }
      return onSave(
        {
          color: values.color,
          connectionString,
          label: values.label.trim() || null,
          name: values.name.trim() || generateRandomName(),
          type: values.type,
        },
        {
          open: draft.canSend && draft.testStatus !== 'error',
          origin,
          syncType: values.syncType,
        }
      )
    })
    if (saved.isErr()) {
      toast.error("Couldn't save the connection", {
        description: toError(saved.error.cause).message,
      })
    }
  }

  return { draftOf, runTest, save, testError: test.error }
}
